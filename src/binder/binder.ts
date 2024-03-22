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
                // -- Check if the callback returned an error
                const result = await callback(data as CallbackObject);
                if (result instanceof GenericError) throw result;


                // -- If there is an output schema, validate the output
                if (schemas.output.length > 0) {
                    const validated = await validate_output(result, schemas.output);
                    if (validated instanceof GenericError) throw validated;
                    data.fastify.reply.send(validated);
                }

                // -- No output schema, no returned data.
            }

            catch (unknown_error) { 
                return GenericError.from_unknown(
                    unknown_error, 
                    new BinderFailedToExecuteError('Unknown error occurred in binder callback')
                );
            }
        },



        validate: async (request, reply) => {   

            // -- Validate the request inputs
            Log.debug(`Validating request for ${route.path} with method: ${method}`);
            const validated = await validate_binder_request(request, schemas, route.path);

            // -- Check if the validation failed
            Log.debug(`Request for ${route.path} with method: ${method} has been validated`);
            if (validated instanceof GenericError) return validated;
            Log.debug(`Request for ${route.path} with method: ${method} has successfully been validated`);

            // -- Return the validated data
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
    Log.debug(`Adding header: ${key} with value: ${value}`);
    fastify_reply.header(key, value);
};

const add_headers = (fastify_reply: FastifyReply) => ([key, value]: [string, string]) => {
    Log.debug(`Adding headers: ${key} with value: ${value}`);
    fastify_reply.header(key, value);
};

const remove_header = (fastify_reply: FastifyReply) => (key: string) => {
    Log.debug(`Removing header: ${key}`);
    fastify_reply.removeHeader(key);
};

const remove_headers = (fastify_reply: FastifyReply) => (keys: Array<string>) => {
    Log.debug(`Removing headers: ${keys}`);
    keys.forEach(key => fastify_reply.removeHeader(key));
};