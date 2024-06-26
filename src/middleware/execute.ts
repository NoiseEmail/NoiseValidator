import { Cookie } from 'noise_validator/src/binder/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from 'noise_validator/src/error';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { MiddlewareValidationError } from './errors';
import { RequestProcessor } from 'noise_validator/src/route';



/**
 * In javascript land all array / object types are passed by
 * reference.
 */
const build_middleware_object = (
    cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }>,
    header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }>,
    fastify: { request: FastifyRequest, reply: FastifyReply },
    request_processor: RequestProcessor
): MiddlewareNamespace.AnyMiddlewareRequestObject => {
    return {
        headers: fastify.request.headers,
        body: fastify.request.body,
        query: fastify.request.query,
        fastify,
        request_processor,

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
    cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }>,
    header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }>,
) => {

    // -- In the middlware youll be able to set headers and cookies
    //    in 3 different ways, on failure, on success and on both
    const on_success_cookies: Map<string, Cookie.Shape> = new Map();
    const on_success_headers: Map<string, string> = new Map();

    const on_failure_cookies: Map<string, Cookie.Shape> = new Map();
    const on_failure_headers: Map<string, string> = new Map();

    const on_both_cookies: Map<string, Cookie.Shape> = new Map();
    const on_both_headers: Map<string, string> = new Map();

    // -- Loop through all the cookies
    cookie_map.forEach((value, key) => {
        switch (value.on) {
            case 'on-success': on_success_cookies.set(key, value.cookie); break;
            case 'on-failure': on_failure_cookies.set(key, value.cookie); break;
            case 'on-both': on_both_cookies.set(key, value.cookie); break;
        }
    });

    // -- Loop through all the headers
    header_map.forEach((value, key) => {
        switch (value.on) {
            case 'on-success': on_success_headers.set(key, value.value); break;
            case 'on-failure': on_failure_headers.set(key, value.value); break;
            case 'on-both': on_both_headers.set(key, value.value); break;
        }
    });

    return {
        on_success_cookies,
        on_success_headers,
        on_failure_cookies,
        on_failure_headers,
        on_both_cookies,
        on_both_headers,
    };
};



const one = async (
    middleware: MiddlewareNamespace.GenericMiddlewareConstructor<unknown>,
    fastify: { request: FastifyRequest, reply: FastifyReply },
    request_processor: RequestProcessor
): Promise<MiddlewareNamespace.MiddlewareValidationResult> => {
    try {
        const cookie_map: Map<string, { cookie: Cookie.Shape, on: MiddlewareNamespace.ExecuteOn }> = new Map();
        const header_map: Map<string, { value: string, on: MiddlewareNamespace.ExecuteOn }> = new Map();
        const request_object = build_middleware_object(cookie_map, header_map, fastify, request_processor);

        // -- Variables to store the result
        const instance = new middleware(request_object); 
        const data = await instance.execute();

        // -- Return the result
        return { ...build_return_object(cookie_map, header_map), ...data };
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
    fastify: { request: FastifyRequest, reply: FastifyReply },
    request_processor: RequestProcessor
): Promise<{ 
    data: Record<string, { success: boolean, data: unknown }>,
    overall_success: boolean,
    on_success_cookies: Map<string, Cookie.Shape>,
    on_success_headers: Map<string, string>,
    on_failure_cookies: Map<string, Cookie.Shape>,
    on_failure_headers: Map<string, string>,
    on_both_cookies: Map<string, Cookie.Shape>,
    on_both_headers: Map<string, string>
}> => {

    // -- Theres three types of cookies / headers, on success, on failure and on both
    let on_success_cookies: Map<string, Cookie.Shape> = new Map();
    let on_success_headers: Map<string, string> = new Map();

    let on_failure_cookies: Map<string, Cookie.Shape> = new Map();
    let on_failure_headers: Map<string, string> = new Map();

    let on_both_cookies: Map<string, Cookie.Shape> = new Map();
    let on_both_headers: Map<string, string> = new Map();


    const data: Record<string, { success: boolean, data: unknown }> = {};
    if (!middlewares) return { overall_success: true, data, on_success_cookies, on_success_headers, on_failure_cookies, on_failure_headers, on_both_cookies, on_both_headers };
    let overall_success = true;

    // -- Execute all the middlewares
    const promises: Array<Promise<void>> = Object.keys(middlewares).map(async (key) => {

        try { 
            const result = await one(middlewares[key], fastify, request_processor);
            data[key] = { success: result.success, data: result.data };

            on_success_cookies = new Map([...on_success_cookies, ...result.on_success_cookies]);
            on_success_headers = new Map([...on_success_headers, ...result.on_success_headers]);
            on_failure_cookies = new Map([...on_failure_cookies, ...result.on_failure_cookies]);
            on_failure_headers = new Map([...on_failure_headers, ...result.on_failure_headers]);
            on_both_cookies = new Map([...on_both_cookies, ...result.on_both_cookies]);
            on_both_headers = new Map([...on_both_headers, ...result.on_both_headers]);

            if (!result.success) overall_success = false;
        }

        catch (unknown_error) {
            throw GenericError.from_unknown(
                unknown_error, 
                new MiddlewareValidationError('Failed to execute middleware.')
            );
        }
    });

    // -- Wait for all the promises to resolve
    await Promise.all(promises);
    return { overall_success, data, on_success_cookies, on_success_headers, on_failure_cookies, on_failure_headers, on_both_cookies, on_both_headers };
};



export {
    build_middleware_object,
    one,
    many
};