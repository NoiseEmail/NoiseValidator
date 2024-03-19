import { FastifyReply, HTTPMethods } from "fastify";
import { DefaultBinderConfiguration } from ".";
import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { BinderCallbackObject, OptionalBinderConfiguration } from "./types";
import { mergician } from "mergician";
import { Route } from "../route";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,

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