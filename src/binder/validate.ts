import { FastifyReply, FastifyRequest } from "fastify";
import {
    BinderInputValidatorResult,
    BinderOutputValidatorResult,
    CookieShape,
    SchemasValidator,
} from "./types.d";
import { GenericError } from "../error";
import { FailedToValidateInputError } from "./errors";
import { Schema } from "../schema/types.d";
import { mergician } from "mergician";
import { Log } from "..";
import { Middleware } from "../middleware/types";
import Cookie from 'cookie';


const validate_binder_request = async (
    fastify_request: FastifyRequest,
    schemas: SchemasValidator,
    name: string
): Promise<BinderInputValidatorResult> => {
    try {
        const body = validate_inputs(fastify_request?.body, schemas?.input?.body);
        const query = validate_inputs(fastify_request?.query, schemas?.input?.query);
        const headers = validate_inputs(fastify_request?.headers, schemas?.input?.headers);

        // -- Parse the cookies
        const cookie_string = fastify_request?.headers?.cookie ?? '';
        const cookie_object = Cookie.parse(cookie_string);
        const cookies = validate_inputs(cookie_object, schemas?.input?.cookies);


        // -- We are entrusting the url to be parsed by Fastify
        const url = fastify_request?.params;

        return { 
            body: await body, 
            query: await query, 
            headers: await headers, 
            cookies: await cookies,
            url
        }
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError(name + ' - validate_binder_request')
        );
    }
};



const validate_binder_output = async (
    data: { 
        body?: unknown, 
        headers?: unknown,
    },
    schemas: SchemasValidator,
    name: string
): Promise<BinderOutputValidatorResult> => {
    try {
        const body = validate_inputs(data?.body, schemas?.output?.body);
        const headers = validate_inputs(data?.headers, schemas?.output?.headers);

        return { 
            body: (await body) || {},
            headers: (await headers) || {}
        };
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError(name + ' - validate_binder_output')
        );
    };
}




const validate_input = async (
    data: unknown,
    schema: Schema.SchemaLike<Schema.SchemaType>
): Promise<unknown> => {
    try {
        return await schema.validate(data);
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_input')
        );
    }
};



const validate_inputs = async (
    data: unknown,
    schemas: Array<Schema.SchemaLike<Schema.SchemaType>>
): Promise<object> => {
    try {
        // -- Attempt to validate the data against all the schemas
        const result = await Promise.all(schemas.map(async (
            schema: 
                Schema.SchemaLike<Schema.SchemaType, 
                Schema.ParsedSchema<Schema.InputSchema>>
        ) => {
            const validated = await validate_input(data, schema);
            if (validated instanceof GenericError) throw validated;
            return validated;
        }));


        // -- Cant merge a single or no objects
        if (result.length <= 1) return result[0] ?? {};
        else return mergician({}, ...result as Array<object>) as object;
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_inputs')
        );
    }
};



const execute_middleware = async (
    fastify_request: FastifyRequest,
    fastify_reply: FastifyReply,
    middleware: Middleware.GenericMiddlewareConstructor<unknown> 
): Promise<{
    data: unknown,
    cookies: Map<string, CookieShape>
}> => {
    try {
        const cookie_map: Map<string, CookieShape> = new Map();

        const request_object = {
            headers: fastify_request?.headers,
            body: fastify_request?.body,
            query: fastify_request?.query,
            middleware: {},

            set_header: (key: string, value: string) => fastify_reply.header(key, value),
            remove_header: (key: string) => fastify_reply.removeHeader(key),

            set_cookie: (name: string, cookie: CookieShape) => cookie_map.set(name, cookie),
            remove_cookie: (name: string) => cookie_map.delete(name),

            fastify: { request: fastify_request, reply: fastify_reply }
        };



        // -- Variables to store the result
        let final_result: unknown;
        let callback_called = false;



        const instance = new middleware(request_object, 
            // -- On invalid
            (error: GenericError) => {
                if (callback_called) return
                    Log.warn(middleware.name + ' - Middleware invalid callback called multiple times');

                callback_called = true;
                final_result = error;

                Log.debug(`Middleware failed to execute: ${middleware.name} - ${error.message}`);
            },

            // -- On valid
            (data: unknown) => {
                if (callback_called) return 
                    Log.warn(middleware.name + ' - Middleware success callback called multiple times');

                callback_called = true;
                final_result = data;

                Log.debug(`Middleware successfully executed: ${middleware.name}`);
            }
        ); 



        // -- Execute the middleware
        await instance.execute();
        if (final_result instanceof Error) throw final_result;
        if (!callback_called) throw new Error('Middleware did not call the callback');
        return {
            data: final_result,
            cookies: cookie_map
        };
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, execute_middleware')
        );
    }
};



const validate_middlewares = async (
    fastify_request: FastifyRequest,
    fastify_reply: FastifyReply,
    middlewares?: { [key: string]: Middleware.GenericMiddlewareConstructor<unknown> }
): Promise<{ 
    middleware: { [key: string]: unknown },
    cookies: Map<string, CookieShape>
}> => {
    try {   

        // -- If there are no middlewares, return an empty object
        if (!middlewares) return { middleware: {}, cookies: new Map<string, CookieShape>() };
        const middleware_data: { [key: string]: unknown } = {};
        const middleware_cookies: Map<string, CookieShape> = new Map<string, CookieShape>();



        // -- Execute all the middlewares
        const promises: Array<Promise<void>> = Object.keys(middlewares).map(async (key) => {
            
            const middleware = middlewares[key];
            const result = await execute_middleware(fastify_request, fastify_reply, middleware);
            if (result instanceof Error) throw result;

            middleware_data[key] = result.data;
            result.cookies.forEach((value, key) => middleware_cookies.set(key, value));
        });



        // -- Wait for all the promises to resolve
        await Promise.all(promises);
        return {
            middleware: middleware_data,
            cookies: middleware_cookies
        };
    }

    catch (unknown_error) {
        throw GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_middlewares')
        );
    }
};



export {
    validate_binder_output,
    validate_binder_request,
    validate_input,
    validate_inputs,
    execute_middleware,
    validate_middlewares
}