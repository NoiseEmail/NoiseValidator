import { FastifyReply, HTTPMethods } from "fastify";
import { BinderFailedToExecuteError, DefaultBinderConfiguration, validate_binder_request, validate_output } from ".";
import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { BinderCallbackObject, BinderCallbackReturn, CreateArray, DeepMergeReturnTypes, GetOutputType, OptionalBinderConfiguration, SchemasValidator } from "./types";
import { mergician } from "mergician";
import { Route } from "../route";
import { GenericError } from "../error/types";

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
        GenericError.GenericErrorLike | 
        Promise<GenericError.GenericErrorLike>
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
    configuration = mergician(configuration, DefaultBinderConfiguration);
    route.add_binder({
        callback: async (data) => {
            try {
                const result = await callback(data as CallbackObject);
                if (result instanceof GenericError.GenericErrorLike) throw result;

                // -- If there is an output schema, validate the output
                if (schemas.output.length > 0) {
                    const validated = await validate_output(result, schemas.output);
                    if (validated instanceof GenericError.GenericErrorLike) throw validated;
                    return validated;
                }

                // -- If theres no schema, just return the result
                return result;
            }

            catch (error) { 
                if (error instanceof GenericError.GenericErrorLike) return error;
                const schema_error = new BinderFailedToExecuteError('schema');
                schema_error.data = { error };
                return schema_error;
            }
        },

        validate: async (request, reply) => {
            const validated = await validate_binder_request(request, schemas, route.path);
            if (validated instanceof GenericError.GenericErrorLike) return validated;
            return {
                middleware: configuration.middleware,
                body: validated.body,
                query: validated.query,
                headers: validated.headers,
                url: validated.url,

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