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






export {
    validate_binder_output,
    validate_binder_request,
    validate_input,
    validate_inputs
}