import CookieParser from 'cookie';
import Log from '@logger';
import { ArrayModifier, BinderInputValidatorResult, BinderOutputValidatorResult, Cookie, Schemas } from '@binder/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from '@error';
import { mergician } from 'mergician';
import { MiddlewareNamespace } from '@middleware/types';
import { SchemaNamespace } from '@schema/types';
import { MiddlewareValidationError } from './errors';



/**
 * In javascript land all array / object types are passed by
 * reference.
 */
const build_middleware_object = (
    cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }>,
    header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }>,
    fastify: { request: FastifyRequest, reply: FastifyReply }
): MiddlewareNamespace.AnyMiddlewareRequestObject => {
    return {
        headers: fastify.request.headers,
        body: fastify.request.body,
        query: fastify.request.query,
        fastify,
        middleware: {},

        set_header: (
            key: string, 
            value: string,
            on: MiddlewareNamespace.ExecuteOn = 'on-success'
        ) => header_map.set(key, { value, on }),
        remove_header: (key: string) => header_map.delete(key),

        set_cookie: (
            name: string, 
            cookie: Cookie.Shape,
            on: MiddlewareNamespace.ExecuteOn = 'on-success'
        ) => cookie_map.set(name, { cookie, on }),
        remove_cookie: (name: string) => cookie_map.delete(name),
    };
};



const build_return_object = (
    success: boolean,
    cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }>,
    header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }>,
): {
    cookies: Map<string, Cookie.Shape>,
    headers: Map<string, string>
} => {
    const headers: Map<string, string> = new Map();
    const cookies: Map<string, Cookie.Shape> = new Map();
    const on = success ? 'on-success' : 'on-failure';
    header_map.forEach((value, key) => { if (value.on === on || value.on === 'on-both') headers.set(key, value.value); });
    cookie_map.forEach((value, key) => { if (value.on === on || value.on === 'on-both') cookies.set(key, value.cookie); });
    return { cookies, headers };
};



const one = async (
    middleware: MiddlewareNamespace.GenericMiddlewareConstructor<unknown>,
    fastify: { request: FastifyRequest, reply: FastifyReply }
): Promise<{
    data: unknown,
    success: boolean,
    cookies: Map<string, Cookie.Shape>,
    headers: Map<string, string>,
    error?: GenericError | unknown
}> => {
    try {

        // -- In the middlware youll be able to set headers and cookies
        //    in 3 different ways, on failure, on success and on both
        const cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }> = new Map();
        const header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }> = new Map();
        const request_object = build_middleware_object(cookie_map, header_map, fastify);

        // -- Variables to store the result
        let final_result: GenericError | unknown = null;
        let callback_already_called = false;
        const instance = new middleware(request_object, 
            // -- On invalid
            (error: GenericError) => {
                if (callback_already_called) 
                    return Log.warn(`${middleware.name} - Middleware invalid callback called multiple times`)
                callback_already_called = true;
                final_result = error;
            },

            // -- On valid
            (data: unknown) => {
                if (callback_already_called) 
                    return Log.warn(`${middleware.name} - Middleware valid callback called multiple times`)
                callback_already_called = true;
                final_result = data;
            }
        ); 

        // -- Execute the middleware
        await instance.execute();
        if (!callback_already_called) throw new Error('Middleware did not call the callback');

        // -- Return the result
        return {
            data: final_result,
            success: callback_already_called,
            error: final_result,
            ...build_return_object(!(final_result instanceof Error), cookie_map, header_map)
        };
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new MiddlewareValidationError('Failed to execute middleware.')
        );
    }
};



const many = async (
    middlewares: { [key: string]: MiddlewareNamespace.GenericMiddlewareConstructor<unknown> },
    fastify: { request: FastifyRequest, reply: FastifyReply }
): Promise<{ 
    middleware: Map<string, unknown>,
    cookies: Map<string, Cookie.Shape>,
    headers: Map<string, string>
}> => {
    const middleware: Map<string, unknown> = new Map();
    const cookies: Map<string, Cookie.Shape> = new Map();
    const headers: Map<string, string> = new Map();

    // -- If there are no middlewares, return an empty object
    if (!middlewares) return { middleware, cookies, headers };

    // -- Execute all the middlewares
    const promises: Array<Promise<void>> = Object.keys(middlewares).map(async (key) => {
        const result = await one(middlewares[key], fastify);

        // -- Set the cookies and header
        result.headers.forEach((value, key) => headers.set(key, value));
        result.cookies.forEach((value, key) => cookies.set(key, value));

        // -- If the middleware failed, throw an error
        if (!result.success) throw result.error;
        middleware.set(key, result.data);
    });

    // -- Wait for all the promises to resolve
    await Promise.all(promises);
    return { middleware, cookies, headers };
};



export {
    build_middleware_object,
    one,
    many
};