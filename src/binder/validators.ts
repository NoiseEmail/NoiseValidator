import CookieParser from 'cookie';
import Log from '@logger';
import { ArrayModifier, BinderInputValidatorResult, BinderOutputValidatorResult, Cookie, Schemas } from './types';
import { FailedToValidateInputError } from './errors';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from '@error';
import { mergician } from 'mergician';
import { MiddlewareNamespace } from '@middleware/types';
import { SchemaNamespace } from '@schema/types';



/**
 * @name validate_binder_request
 * 
 * @description Validates the request inputs, it requires the schema types to be passed in
 * so that we can achive type safety later on, this function wont return unless all the
 * schemas PASSED validation, if anything causes validation to fail, an error will be thrown.
 * 
 * @param {FastifyRequest} fastify_request - The request object from Fastify
 * @param {Schemas} schemas - The schemas to validate the request against
 * @param {string} name - The name of the binder
 * 
 * @returns {Promise<BinderInputValidatorResult>} - The validated inputs
 */
const validate_binder_request = async <
    BodySchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    QuerySchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    HeadersSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    CookiesSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    DynamicURLSchema extends string,
    ValidatedType = BinderInputValidatorResult<BodySchema, QuerySchema, HeadersSchema, CookiesSchema, DynamicURLSchema>
>(
    fastify_request: FastifyRequest,
    schemas: Schemas,
    name: string
): Promise<ValidatedType> => {
    try {
        const body = validate_inputs(fastify_request?.body, schemas?.input?.body);
        const query = validate_inputs(fastify_request?.query, schemas?.input?.query);
        const headers = validate_inputs(fastify_request?.headers, schemas?.input?.headers);
        const cookie_string = fastify_request?.headers?.cookie ?? '';
        const cookie_object = CookieParser.parse(cookie_string);
        const cookies = validate_inputs(cookie_object, schemas?.input?.cookies);
        const url = fastify_request?.params;


        return { 
            body: await body, 
            query: await query, 
            headers: await headers, 
            cookies: await cookies,
            url
        } as ValidatedType;
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
    schemas: Schemas,
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
    schema: SchemaNamespace.SchemaLike
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
    schemas: Array<SchemaNamespace.SchemaLike>
): Promise<object> => {
    try {
        // -- Attempt to validate the data against all the schemas
        const result = await Promise.all(schemas.map(async (schema) => await validate_input(data, schema)));
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
    middleware: MiddlewareNamespace.GenericMiddlewareConstructor<unknown> 
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
        const cookie_map: Map<string, {
            cookie: Cookie.Shape,
            on: MiddlewareNamespace.ExecuteOn
        }> = new Map();

        const header_map: Map<string, {
            value: string,
            on: MiddlewareNamespace.ExecuteOn
        }> = new Map();



        const request_object = {
            headers: fastify_request?.headers,
            body: fastify_request?.body,
            query: fastify_request?.query,
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

            fastify: {
                request: fastify_request,
                reply: fastify_reply
            }
        };



        // -- Variables to store the result
        let final_result: GenericError | unknown = null;
        let callback_already_called = false;
        const instance = new middleware(request_object, 
            // -- On invalid
            (error: GenericError) => {
                if (callback_already_called) return Log.warn(`${middleware.name} - Middleware invalid callback called multiple times`)
                callback_already_called = true;
                final_result = error;
            },

            // -- On valid
            (data: unknown) => {
                if (callback_already_called) return Log.warn(`${middleware.name} - Middleware valid callback called multiple times`)
                callback_already_called = true;
                final_result = data;
            }
        ); 



        // -- Execute the middleware
        await instance.execute();

        // -- Ensure the callback was called
        if (!callback_already_called) throw new Error('Middleware did not call the callback');

        // -- Get the final headers and cookies
        const final_header_map: Map<string, string> = new Map();
        const final_cookie_map: Map<string, Cookie.Shape> = new Map();
        const on = callback_already_called ? 'on-success' : 'on-failure';
        header_map.forEach((value, key) => { if (value.on === on || value.on === 'on-both') final_header_map.set(key, value.value); });
        cookie_map.forEach((value, key) => { if (value.on === on || value.on === 'on-both') final_cookie_map.set(key, value.cookie); });

        // -- Return the result
        return {
            data: final_result,
            cookies: final_cookie_map,
            headers: final_header_map,
            success: callback_already_called,
            error: final_result
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
    middlewares?: { [key: string]: MiddlewareNamespace.GenericMiddlewareConstructor<unknown> }
): Promise<{ 
    middleware: Map<string, unknown>,
    cookies: Map<string, Cookie.Shape>,
    headers: Map<string, string>
}> => {
    try {   
        const middleware: Map<string, unknown> = new Map();
        const cookies: Map<string, Cookie.Shape> = new Map();
        const headers: Map<string, string> = new Map();

        // -- If there are no middlewares, return an empty object
        if (!middlewares) return { middleware, cookies, headers };

        // -- Execute all the middlewares
        const promises: Array<Promise<void>> = Object.keys(middlewares).map(async (key) => {
            const result = await execute_middleware(fastify_request, fastify_reply, middlewares[key]);

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