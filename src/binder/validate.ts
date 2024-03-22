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
        if (body instanceof GenericError) throw body;

        const query = await validate_inputs(fastify_request.query, schemas.query);
        if (body instanceof GenericError) throw query;

        const headers = await validate_inputs(fastify_request.headers, schemas.headers);
        if (body instanceof GenericError) throw headers;


        // -- We are entrusting the url to be parsed by Fastify
        const url = fastify_request.params;
        return { body, query, headers, url }
    }

    catch (unknown_error) {
        return GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError(name + ' - validate_binder_request')
        );
    }
};



export const validate_output = async (
    data: any,
    schema: Array<Schema.SchemaLike<any>>
): Promise<any | GenericError> => {
    try {
        const result = await validate_inputs(data, schema);
        if (result instanceof GenericError) throw result;
        return result;
    }

    catch (unknown_error) {
        return GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_output')
        );
    }
};



const validate_input = async (
    data: any,
    schema: Schema.SchemaLike<any>
): Promise<any | GenericError> => {
    try {
        const result = await schema.validate(data);
        if (result.type !== 'data') throw result.error;
        else return result.data;
    }

    catch (unknown_error) {
        return GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_input')
        );
    }
};



const validate_inputs = async (
    data: any,
    schemas: Array<Schema.SchemaLike<any>>
): Promise<any | GenericError> => {
    try {
        // -- Attempt to validate the data against all the schemas
        const result = await Promise.all(schemas.map(async (schema) => {
            const validated = await validate_input(data, schema);
            if (validated instanceof GenericError) throw validated;
            return validated;
        }));


        // -- Cant merge a single or no objects
        if (result.length <= 1) return result[0];
        else return mergician({}, ...result);
    }

    catch (unknown_error) {
        return GenericError.from_unknown(
            unknown_error, 
            new FailedToValidateInputError('validator, validate_inputs')
        );
    }
};