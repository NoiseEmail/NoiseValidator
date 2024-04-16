import { FastifyReply, FastifyRequest } from "fastify";
import { BinderValidatorResult, SchemasValidator } from "./types.d";
import { GenericError } from "../error";
import { FailedToValidateInputError } from "./errors";
import { Schema } from "../schema/types.d";
import { mergician } from "mergician";
import { Log } from "..";
import { add_header, add_headers, remove_header, remove_headers } from "./binder";
import { Middleware } from "../middleware/types";



const validate_binder_request = async (
    fastify_request: FastifyRequest,
    schemas: SchemasValidator,
    name: string
): Promise<BinderValidatorResult> => {
    try {
        const body = await validate_inputs(fastify_request.body, schemas.body);
        const query = await validate_inputs(fastify_request.query, schemas.query);
        const headers = await validate_inputs(fastify_request.headers, schemas.headers);


        // -- We are entrusting the url to be parsed by Fastify
        const url = fastify_request.params;
        return { body, query, headers, url }
    }

    catch (unknown_error) {
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError(name + ' - validate_binder_request')
        );

        Log.debug(`validate_binder_request: Binder failed to validate request: ${error.id}`);
        throw error;
    }
};



const validate_output = async (
    data: unknown,
    schema: Array<Schema.SchemaLike<Schema.SchemaType>>
): Promise<unknown> => {
    try { return await validate_inputs(data, schema); }

    catch (unknown_error) {
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_output')
        );

        Log.debug(`validate_output: Failed to validate output: ${error.id}`);
        throw error;
    }
};



const validate_input = async (
    data: unknown,
    schema: Schema.SchemaLike<Schema.SchemaType>
): Promise<unknown> => {
    try {
        return await schema.validate(data);
    }

    catch (unknown_error) {
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_input')
        );

        Log.debug(`validate_input: Failed to validate input: ${error.id}`);
        throw error;
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
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_inputs')
        );

        Log.debug(`validate_inputs: Failed to validate inputs: ${error.id}`);
        throw error;
    }
};



const execute_middleware = async (
    fastify_request: FastifyRequest,
    fastify_reply: FastifyReply,
    middleware: Middleware.GenericMiddlewareConstructor<unknown> 
): Promise<unknown> => {
    try {
        const request_object = {
            headers: fastify_request.headers,
            body: fastify_request.body,
            query: fastify_request.query,
            middleware: {},

            set_header: add_header(fastify_reply),
            set_headers: add_headers(fastify_reply),
            remove_header: remove_header(fastify_reply),
            remove_headers: remove_headers(fastify_reply),

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
        return final_result;
    }

    catch (unknown_error) {
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, execute_middleware')
        );

        Log.debug(`execute_middleware: Failed to execute middleware: ${error.id}`);
        throw error;
    }
};



const validate_middlewares = async (
    fastify_request: FastifyRequest,
    fastify_reply: FastifyReply,
    middlewares?: { [key: string]: Middleware.GenericMiddlewareConstructor<unknown> }
): Promise<{ [key: string]: unknown }> => {
    try {   

        // -- If there are no middlewares, return an empty object
        if (!middlewares) return {};
        const return_data: { [key: string]: unknown } = {};


        // -- Execute all the middlewares
        const promises: Array<Promise<void>> = Object.keys(middlewares).map(async (key) => {
            const middleware = middlewares[key];
            const result = await execute_middleware(fastify_request, fastify_reply, middleware);
            if (result instanceof Error) throw result;

            return_data[key] = result;
        });


        // -- Wait for all the promises to resolve
        await Promise.all(promises);
        return return_data;
    }

    catch (unknown_error) {
        const error = GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_middlewares')
        );

        Log.debug(`validate_middlewares: Failed to validate middlewares: ${error.id}`);
        throw error;
    }
};



export {
    validate_binder_request,
    validate_output,
    validate_input,
    validate_inputs,
    execute_middleware,
    validate_middlewares
}