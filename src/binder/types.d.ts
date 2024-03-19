import { Binder } from ".";
import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { HTTPMethods } from "fastify";


export type BinderMapObject = {
    callback: Function,
    middleware: Middleware.MiddlewareObject,
    schemas: BinderConfigurationSchema<any, any, any>
    method: HTTPMethods
};


export type BinderCallbackObject<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>,
    Query extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>,
    Headers extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>
> = {
    middleware: Middleware.ParsedMiddlewareObject<Middleware>,
    body: DeepMergeReturnTypes<CreateArray<Body>>,
    query: DeepMergeReturnTypes<CreateArray<Query>>,
    headers: DeepMergeReturnTypes<CreateArray<Headers>>,
};



export type BinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>
> = {
    middleware: Middleware,
    schemas: BinderConfigurationSchema<Body, Query, Headers>
};



export type BinderConfigurationSchema<
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>
> = {
    body: Body,
    query: Query,
    headers: Headers
};



export type OptionalBinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>
> = {
    middleware?: Middleware,
    schemas?: Partial<BinderConfigurationSchema<Body, Query, Headers>>
};


export type IsArray<T> = T extends Array<any> ? true : false;
export type CreateArray<T> = T extends Array<any> ? T : [T];


type DeepMerge<T> = T extends object
    ? {
        [K in keyof T]: T[K] extends infer U
            ? U extends object
                ? DeepMerge<U>
                    : U
                        : never;
        }
    : never;

type DeepMergeReturnTypes<
    Schemas extends Array<Schema.SchemaLike<any>>
> = DeepMerge<
    {
        [K in keyof Schemas[number]]: Schemas[number][K] extends infer U
        ? U extends Schema.SchemaLike<any>
            ? U extends { _return_type: infer R }
                ? R
                    : never
                        : DeepMerge<U>
        : never;
    }['_return_type']
>;




export type BinderMap = Map<HTTPMethods, Array<BinderMapObject>>;