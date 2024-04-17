import { HTTPMethods } from "fastify";
import {
    BinderFailedToExecuteError,
    DefaultBinderConfiguration,
    validate_binder_request,
} from ".";
import { Middleware } from "../middleware/types.d";
import { Schema } from "../schema/types.d";
import {
    BinderCallbackObject,
    OptionalBinderConfiguration,
    ExtractOutputSchemaTypes,
    SchemasValidator,
    CookieShape,
} from "./types.d";
import { mergician } from "mergician";
import { Route } from "../route";
import { GenericError } from "../error";
import { Log } from "..";
import { validate_binder_output, validate_middlewares } from "./validate";
import { create_set_cookie_header } from "./cookie";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    // -- Input schemas
    BodyInputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    QueryInputSchema extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    HeadersInputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    CookieInputSchema extends Schema.SchemaLike<'cookies'> | Array<Schema.SchemaLike<'cookies'>>,
    DynamicURLInputSchema extends string,

    // -- Output schemas
    BodyOutputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    HeadersOutputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,


    OutputObject extends ExtractOutputSchemaTypes<
        BodyOutputSchema,
        HeadersOutputSchema
    >,


    CallbackObject extends BinderCallbackObject<
        Middleware,
        BodyInputSchema,
        QueryInputSchema,
        HeadersInputSchema,
        CookieInputSchema,
        DynamicURLInputSchema
    >,
>(
    route: Route<DynamicURLInputSchema>,
    method: HTTPMethods,
    configuration: OptionalBinderConfiguration<
        Middleware,
        BodyInputSchema,
        QueryInputSchema,
        HeadersInputSchema,
        CookieInputSchema,
        
        BodyOutputSchema,
        HeadersOutputSchema
    >,
    callback: (data: CallbackObject) => 
        OutputObject | Promise<OutputObject>
): void {
    

    // -- Ensure that all the schemas are arrays, even if they are empty
    const schemas: SchemasValidator = {
        input: {
            body: make_array(configuration.schemas?.input?.body),
            query: make_array(configuration.schemas?.input?.query),
            headers: make_array(configuration.schemas?.input?.headers),
            cookies: make_array(configuration.schemas?.input?.cookies)
        },
        
        output: {
            body: make_array(configuration.schemas?.output?.body),
            headers: make_array(configuration.schemas?.output?.headers)
        }
    };



    // -- Merge the default configuration with the user configuration
    configuration = mergician(DefaultBinderConfiguration, configuration);
    route.add_binder({
        callback: async (data) => {
            try {
                // -- Check if the callback returned an error
                const result = await callback(data as CallbackObject);
                if (result instanceof GenericError) throw result;


                // -- If there is an output schema, validate the output
                const output = await validate_binder_output(result, schemas, route.path);

                // -- Send the response
                data.fastify.reply.headers(output.headers);
                if (data.cookie_objects.size > 0) data.fastify.reply.header(
                    'Set-Cookie', create_set_cookie_header(data.cookie_objects));
                data.fastify.reply.send(output.body);
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


            const remove_cookie = (name: string) => middleware.cookies.delete(name);
            const set_cookie = (name: string, cookie: CookieShape) => middleware.cookies.set(name, cookie);


            // -- Return the validated data
            return {
                middleware: middleware.middleware,
                cookie_objects: middleware.cookies,
                body: validated.body,
                query: validated.query,
                headers: validated.headers,
                cookies: validated.cookies,
                url: validated.url,
                fastify: { request, reply },

                set_cookie: (name: string, cookie: CookieShape) => 
                    { set_cookie(name, cookie); },

                remove_cookie: (name: string) =>
                    { remove_cookie(name); }
                
            } as BinderCallbackObject<
                Middleware,
                BodyInputSchema,
                QueryInputSchema,
                HeadersInputSchema,
                CookieInputSchema,
                DynamicURLInputSchema
            >;
        },

        method
    });
};



const make_array = <T extends unknown>(value: T | Array<T> | undefined): Array<T> => {
    if (typeof value === 'undefined') return [];
    return Array.isArray(value) ? value : [value];
}



export {
    Binder,
    make_array
}