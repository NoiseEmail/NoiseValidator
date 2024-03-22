import { FastifyRequest } from "fastify";
import { BinderValidatorResult, SchemasValidator } from "./types.d";
import { GenericError } from "../error";
import { FailedToValidateInputError } from "./errors";
import { Schema } from "../schema/types.d";
import { mergician } from "mergician";



export const validate_binder_request = async (
    fastify_request: FastifyRequest,
    schemas: SchemasValidator,
    name: string
): Promise<BinderValidatorResult | GenericError> => {
    try {

        const body = await validate_inputs(fastify_request.body, schemas.body);
        if (GenericError.is_error(body)) throw body;

        const query = await validate_inputs(fastify_request.query, schemas.query);
        if (GenericError.is_error(query)) throw query;

        const headers = await validate_inputs(fastify_request.headers, schemas.headers);
        if (GenericError.is_error(headers)) throw headers;

        // -- We are entrusting the url to be parsed by Fastify
        const url = fastify_request.params;
        return Promise.resolve({ body, query, headers, url });
    }

    catch (error) {
        if (GenericError.is_error(error)) error as GenericError;
        const validator_error = new FailedToValidateInputError(name);
        validator_error.data = { error };
        return validator_error;
    }
};



export const validate_output = async (
    data: any,
    schema: Array<Schema.SchemaLike<any>>
): Promise<any | GenericError> => {
    try {
        const result = await validate_inputs(data, schema);
        if (GenericError.is_error(result)) return result;
        return result;
    }

    catch (error) {
        if (GenericError.is_error(error)) error as GenericError;
        const schema_error = new FailedToValidateInputError('schema, validate_output');
        schema_error.data = { error };
        return schema_error;
    }
};



const validate_input = async (
    data: any,
    schema: Schema.SchemaLike<any>
): Promise<any | GenericError> => {
    try {
        const result = await schema.validate(data);
        if (result.type !== 'data') return result.error;
        else return result.data;
    }

    catch (error) {
        if (GenericError.is_error(error)) return error;
        const schema_error = new FailedToValidateInputError('schema, validate_input');
        schema_error.data = { error };
        return schema_error;
    }
};



const validate_inputs = async (
    data: any,
    schemas: Array<Schema.SchemaLike<any>>
): Promise<any | GenericError> => {
    try {
        const result = await Promise.all(schemas.map(async (schema) => {
            const validated =  await validate_input(data, schema);
            if (GenericError.is_error(validated)) 
                throw validated;
            return validated;
        }));


        if (result.length <= 1) return result[0];
        else return mergician({}, ...result);
    }

    catch (error) {
        console.log('error', error);
        if (GenericError.is_error(error)) error as GenericError;
        const validator_error = new FailedToValidateInputError('validator, validate_inputs');
        validator_error.data = { error };
        return Promise.resolve(validator_error);
    }
};