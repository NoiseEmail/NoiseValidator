import { FastifyReply, HTTPMethods } from "fastify";
import { BinderFailedToExecuteError, DefaultBinderConfiguration, validate_binder_request, validate_output } from ".";
import { Middleware } from "../middleware/types.d";
import { Schema } from "../schema/types.d";
import { 
    BinderCallbackObject, 
    CreateArray, 
    DeepMergeReturnTypes, 
    GetOutputType, 
    SplitObject, 
    OptionalBinderConfiguration, 
    SchemasValidator 
} from "./types.d";
import { mergician } from "mergician";
import { Route } from "../route";
import { GenericError } from "../error";
import { Log } from "..";
import { validate_middlewares } from "./validate";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,

    Output extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    ParsedOutput extends DeepMergeReturnTypes<CreateArray<Output>>,
    OutputTypes extends SplitObject<GetOutputType<ParsedOutput, ParsedOutput>>,
    OutputType extends OutputTypes['required'] & OutputTypes['optional'],

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
        OutputType | GenericError |
        Promise<OutputType | GenericError>,
): void {
    

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
                    if (validated instanceof Error) {

                        // -- Make sure the error is a GenericError
                        const error = GenericError.from_unknown(
                            validated, 
                            new BinderFailedToExecuteError('Failed to validate output')
                        );

                        // -- Add a hint to the error
                        error.hint = 'The output of the binder failed to validate against the output schema';
                        throw validated;
                    };
                    data.fastify.reply.send(validated);
                }

                // -- No output schema, no returned data.
            }

            catch (unknown_error) { 
                const error = GenericError.from_unknown(
                    unknown_error, 
                    new BinderFailedToExecuteError('Unknown error occurred in binder callback')
                );

                Log.debug(`Binder failed to execute: ${error.id}`);
                return error;
            }
        },



        validate: async (request, reply) => {   

            // -- Validate the request inputs
            Log.debug(`Validating request for ${route.path} with method: ${method}`);
            const validated = await validate_binder_request(request, schemas, route.path);
            if (validated instanceof GenericError) throw validated;

            // -- Validate the middleware
            Log.debug(`Validating middleware for ${route.path} with method: ${method}`);
            const middleware = await validate_middlewares(request, reply, configuration.middleware);
            if (middleware instanceof GenericError) throw middleware;



            // -- Return the validated data
            return {
                middleware: middleware,
                body: validated.body,
                query: validated.query,
                headers: validated.headers,
                url: validated.url,

                fastify: { request, reply },

                set_header: add_header(reply),
                set_headers: add_headers(reply),
                remove_header: remove_header(reply),
                remove_headers: remove_headers(reply)
            } as BinderCallbackObject<
                Middleware,
                Body,
                Query,
                Headers,
                DynamicURL
            >;
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



export {
    Binder,
    add_header,
    add_headers,
    remove_header,
    remove_headers
}