import { FastifyReply, HTTPMethods } from "fastify";
import { BinderFailedToExecuteError, DefaultBinderConfiguration, validate_binder_request, validate_output } from ".";
import { Middleware } from "../middleware/types.d";
import { Schema } from "../schema/types.d";
import { BinderCallbackObject, BinderCallbackReturn, BinderValidatorResult, CreateArray, DeepMergeReturnTypes, GetOutputType, OptionalBinderConfiguration, SchemasValidator } from "./types.d";
import { mergician } from "mergician";
import { Route } from "../route";
import { GenericError } from "../error";
import { Log } from "..";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,

    Output extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    ParsedOutput extends DeepMergeReturnTypes<CreateArray<Output>>,
    OutputType extends GetOutputType<ParsedOutput, ParsedOutput>,

    DynamicURL extends string,
    
    CallbackObject = BinderCallbackObject<
        Middleware,
        Body,
        Query,
        Headers,
        DynamicURL
    >
>(
    route: Route<DynamicURL>,
    method: HTTPMethods,
    configuration: OptionalBinderConfiguration<
        Middleware,
        Body,
        Query,
        Headers,
        Output
    >,
    callback: (data: CallbackObject) => 
        OutputType | 
        Promise<OutputType> |
        GenericError | 
        Promise<GenericError>
) {
    

    // -- Ensure that all the schemas are arrays, even if they are empty
    const schemas = {
        body: Array.isArray(configuration?.schemas?.body) ? configuration?.schemas?.body : 
            configuration?.schemas?.body ? [configuration.schemas?.body] : [],

        query: Array.isArray(configuration?.schemas?.query) ? configuration?.schemas?.query :
            configuration?.schemas?.query ? [configuration.schemas?.query] : [],

        headers: Array.isArray(configuration?.schemas?.headers) ? configuration?.schemas?.headers :
            configuration?.schemas?.headers ? [configuration.schemas?.headers] : [],

        output: Array.isArray(configuration?.schemas?.output) ? configuration?.schemas?.output :
            configuration?.schemas?.output ? [configuration.schemas?.output] : []
    } as SchemasValidator;



    // -- Merge the default configuration with the user configuration
    configuration = mergician(DefaultBinderConfiguration, configuration);
    route.add_binder({
        callback: async (data) => {
            try {
                const result = await callback(data as CallbackObject);
                if (GenericError.is_generic_error(result)) throw result;

                // -- If there is an output schema, validate the output
                if (schemas.output.length > 0) {
                    const validated = await validate_output(result, schemas.output);
                    if (GenericError.is_generic_error(validated)) throw validated;
                    data.fastify.reply.send(validated);
                }

                // -- No output schema, no returned data.
            }

            catch (error) { 
                if (GenericError.is_generic_error(error)) return error;
                const schema_error = new BinderFailedToExecuteError('schema');
                schema_error.data = { error };
                return schema_error;
            }
        },

        validate: async (request, reply) => {

            if (route.debug) Log.debug(`Validating request for ${route.path} with method: ${method}`);

            const validated = await validate_binder_request(request, schemas, route.path);
            if (route.debug) Log.debug(`Request for ${route.path} with method: ${method} has been validated`);
            if (GenericError.is_generic_error(validated)) return validated as GenericError;
            if (route.debug) Log.debug(`Request for ${route.path} with method: ${method} has successfully been validated`);
            
            return {
                middleware: configuration.middleware,
                body: (validated as BinderValidatorResult).body,
                query: (validated as BinderValidatorResult).query,
                headers: (validated as BinderValidatorResult).headers,
                url: (validated as BinderValidatorResult).url,

                fastify: { request, reply },

                set_header: add_header(reply),
                set_headers: add_headers(reply),
                remove_header: remove_header(reply),
                remove_headers: remove_headers(reply)
            } as BinderCallbackObject<any, any, any, any, any>;
        },

        method
    });
};



const add_header = (fastify_reply: FastifyReply) => (key: string, value: string) => {
    fastify_reply.header(key, value);
};

const add_headers = (fastify_reply: FastifyReply) => ([key, value]: [string, string]) => {
    fastify_reply.header(key, value);
};

const remove_header = (fastify_reply: FastifyReply) => (key: string) => {
    fastify_reply.removeHeader(key);
};

const remove_headers = (fastify_reply: FastifyReply) => (keys: Array<string>) => {
    keys.forEach(key => fastify_reply.removeHeader(key));
};