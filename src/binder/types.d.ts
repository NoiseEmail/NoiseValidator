import { GenericError } from "../error/types";
import { Middleware } from "../middleware/types";
import { DynamicURL } from "../route/types";
import { Schema } from "../schema/types";
import { FastifyReply, FastifyRequest, HTTPMethods } from "fastify";


export type BinderValidatorResult = {
    body: any,
    query: any,
    headers: any,
    url: any
};


export type BinderCallbackReturn = 
    any | 
    GenericError.GenericErrorLike | 
    Promise<
        GenericError.GenericErrorLike |
        any
    >;

export type SchemasValidator = {
    body: Array<Schema.SchemaLike<'body'>>,
    query: Array<Schema.SchemaLike<'query'>>,
    headers: Array<Schema.SchemaLike<'headers'>>,
    output: Array<Schema.SchemaLike<any>>
};


export type BinderMapObject = {
    callback: (data: BinderCallbackObject<any, any, any, any, any>) => BinderCallbackReturn,
    validate: (request: FastifyRequest, reply: FastifyReply) => 
        Promise<BinderCallbackObject<any, any, any, any, any> | GenericError.GenericErrorLike>,
    method: HTTPMethods
};


export type BinderCallbackObject<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>,
    Query extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>,
    Headers extends Schema.SchemaLike<any> | Array<Schema.SchemaLike<any>>,
    DynamicURLString extends string
> = {
    middleware: Middleware.ParsedMiddlewareObject<Middleware>,
    body: DeepMergeReturnTypes<CreateArray<Body>>,
    query: DeepMergeReturnTypes<CreateArray<Query>>,
    headers: DeepMergeReturnTypes<CreateArray<Headers>>,
    url: DynamicURL.Extracted<DynamicURLString>,

    fastify: {
        request: FastifyRequest,
        reply: FastifyReply
    }

    set_header: (key: string, value: string) => void;
    set_headers: ([key, value]: [string, string]) => void;
    
    remove_header: (key: string) => void;
    remove_headers: (keys: Array<string>) => void;
};



export type BinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    Output extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
> = {
    middleware: Middleware,
    schemas: BinderConfigurationSchema<Body, Query, Headers, Output>,
};



export type BinderConfigurationSchema<
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    Output extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
> = {
    body: Body,
    query: Query,
    headers: Headers,
    output: Output
};



export type OptionalBinderConfiguration<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    Output extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
> = {
    middleware?: Middleware,
    schemas?: Partial<BinderConfigurationSchema<Body, Query, Headers, Output>>
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



/**
 * @name GetOutputType
 * @description If the input extends { [x: string]: never; }
 * than the output is void, otherwise the output is the input
 */
export type GetOutputType<
    Input extends Object,
    ParsedOutput extends Object
> =
    Input extends { [x: string]: never; }
        ? void
        : ParsedOutput;