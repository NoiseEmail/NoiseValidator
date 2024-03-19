import { FastifyRequest } from "fastify";
import { BinderValidatorResult, SchemasValidator } from "./types";
import { GenericError } from "../error/types";
import { FailedToValidateInputError } from "./errors";
import { Schema } from "../schema/types";



export const validate_binder_request = async (
    fastify_request: FastifyRequest,
    schemas: SchemasValidator,
    name: string
): Promise<BinderValidatorResult | GenericError.GenericErrorLike> => {
    try {

        const body = await validate_inputs(fastify_request.body, schemas.body);
        if (body instanceof GenericError.GenericErrorLike) throw body;

        const query = await validate_inputs(fastify_request.query, schemas.query);
        if (query instanceof GenericError.GenericErrorLike) throw query;

        const headers = await validate_inputs(fastify_request.headers, schemas.headers);
        if (headers instanceof GenericError.GenericErrorLike) throw headers;

        // -- We are entrusting the url to be parsed by Fastify
        const url = fastify_request.params;
        return Promise.resolve({ body, query, headers, url });
    }

    catch (error) {
        if (error instanceof GenericError.GenericErrorLike) return Promise.resolve(error);
        const validator_error = new FailedToValidateInputError(name);
        validator_error.data = { error };
        return Promise.resolve(validator_error);
    }
};



const validate_input = async (
    data: any,
    schema: Schema.SchemaLike<any>
): Promise<any | GenericError.GenericErrorLike> => {
    try {
        const result = await schema.validate(data);
        if (result.type !== 'data') throw result.error;
        else return result.data;
    }

    catch (error) {
        if (error instanceof GenericError.GenericErrorLike) return Promise.resolve(error);
        const schema_error = new FailedToValidateInputError('schema');
        schema_error.data = { error };
        return Promise.resolve(schema_error);
    }
};



const validate_inputs = async (
    data: any,
    schemas: Array<Schema.SchemaLike<any>>
): Promise<any | GenericError.GenericErrorLike> => {
    try {
        const result = await Promise.all(schemas.map(async (schema) => {
            return await validate_input(data, schema);
        }));

        return result;
    }

    catch (error) {
        if (error instanceof GenericError.GenericErrorLike) return Promise.resolve(error);
        const validator_error = new FailedToValidateInputError('validator');
        validator_error.data = { error };
        return Promise.resolve(validator_error);
    }
};