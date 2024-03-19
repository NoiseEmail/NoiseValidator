import { HTTPMethods } from "fastify";
import { DefaultBinderConfiguration } from ".";
import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { BinderCallbackObject, OptionalBinderConfiguration } from "./types";
import { mergician } from "mergician";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    
    CallbackObject = BinderCallbackObject<
        Middleware,
        Body,
        Query,
        Headers
    >
>(
    method: HTTPMethods,
    configuration: OptionalBinderConfiguration<
        Middleware,
        Body,
        Query,
        Headers
    >,
    callback: (data: CallbackObject) => void
) {
    

    // -- Ensure that all the schemas are arrays, even if they are empty
    const schemas = {
        body: Array.isArray(configuration?.schemas?.body) ? configuration?.schemas?.body : 
            configuration?.schemas?.body ? [configuration.schemas?.body] : [],

        query: Array.isArray(configuration?.schemas?.query) ? configuration?.schemas?.query :
            configuration?.schemas?.query ? [configuration.schemas?.query] : [],

        headers: Array.isArray(configuration?.schemas?.headers) ? configuration?.schemas?.headers :
            configuration?.schemas?.headers ? [configuration.schemas?.headers] : []
    };



    // -- Merge the default configuration with the user configuration
    configuration = mergician(configuration, DefaultBinderConfiguration);
};