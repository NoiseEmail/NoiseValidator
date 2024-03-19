import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { Schema as SchemaClass } from "../schema";




export type BinderCallbackObject<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<any>,
    Query extends Schema.SchemaLike<any>,
    Params extends Schema.SchemaLike<any>,
> = {
    middleware: Middleware.ParsedMiddlewareObject<Middleware>,
    body: Body["_return_type"]
    query: Query["_return_type"],
    params: Params["_return_type"]
};



export type BinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'>,
    Query extends Schema.SchemaLike<'query'>,
    Params extends Schema.SchemaLike<'query'>,
    
> = {
    middleware: Middleware,
    schemas: {
        body?: Body,
        query?: Query,
        params?: Params
    }
};



export type OptionalBinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'>,
    Query extends Schema.SchemaLike<'query'>,
    Params extends Schema.SchemaLike<'query'>,
    
> = Partial<BinderConfiguration<Middleware, Body, Query, Params>>;



export type IsArray<T> = T extends Array<any> ? true : false;