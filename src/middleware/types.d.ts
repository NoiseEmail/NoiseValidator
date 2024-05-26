import { Cookie } from '@binder/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from '@error';
import { SchemaNamespace } from '@schema/types';



export namespace MiddlewareNamespace {


    export class GenericMiddlewareLike<
        ReturnType extends unknown = unknown,
        RequestObject extends AnyMiddlewareRequestObject = AnyMiddlewareRequestObject
    > {
        _return_type: ReturnType;

        public constructor(
            _request_object: RequestObject,
            _on_invalid: (error: GenericError) => void,
            _on_valid: (result: ReturnType) => ReturnType
        );

        protected _request_object: RequestObject;
        protected _on_invalid: (error: GenericError) => void;
        protected _on_valid: (result: ReturnType) => ReturnType;

        protected validate_input<
            SchemaType extends 'body' | 'query' | 'headers' | 'cookies',
            SchemaInput extends SchemaNamespace.SchemaLike,
            ReturnType extends SchemaNamespace.ParsedSchema<SchemaInput["_schema"]>
        >(  
            input_type: SchemaType,
            schema: SchemaInput
        ): Promise<ReturnType>

        protected handler: (
            input_value: RequestObject,
            invalid: (error: GenericError) => void,
            valid: (result: ReturnType) => void
        ) => 
            ReturnType | 
            Promise<ReturnType> |  
            Promise<GenericError> | 
            GenericError;

        protected invalid: (error: GenericError | string) => GenericError;
        protected valid: (result: ReturnType) => void;

        public execute: () => Promise<void>;
        public static get name(): string;
    }



    export type GenericMiddlewareConstructor<
        ReturnType extends unknown = unknown,
        RequestObject extends AnyMiddlewareRequestObject = AnyMiddlewareRequestObject
    > = new (
        _request_object: RequestObject,
        _on_invalid: (error: GenericError) => void,
        _on_valid: (result: ReturnType) => ReturnType
    ) => GenericMiddlewareLike<ReturnType, RequestObject>;



    export type MiddlewareRequestObject<
        BodySchema, 
        QuerySchema, 
        HeaderSchema,
        MiddlewareData
    > = {
        headers: HeaderSchema;
        body: BodySchema;
        query: QuerySchema;
        middleware: MiddlewareData;

        set_header: (key: string, value: string) => void;
        remove_header: (key: string) => void;

        set_cookie: (name: string, cookie: Cookie.Shape) => void;
        remove_cookie: (name: string) => void;

        fastify: {
            request: FastifyRequest;
            reply: FastifyReply;
        }
    };  



    export type MiddlewareConfiguration<
        BodySchema extends SchemaNamespace.NestedSchema,
        QuerySchema extends SchemaNamespace.FlatSchema,
        HeaderSchema extends SchemaNamespace.FlatSchema,
    > = {
        body: BodySchema;
        query: QuerySchema;
        headers: HeaderSchema;
    }


    
    export type OptionalMiddlewareConfiguration<
        BodySchema extends SchemaNamespace.NestedSchema,
        QuerySchema extends SchemaNamespace.FlatSchema,
        HeaderSchema extends SchemaNamespace.FlatSchema,
    > = {
        body?: BodySchema;
        query?: QuerySchema;
        headers?: HeaderSchema;
    }



    export type AnyMiddlewareRequestObject = 
        MiddlewareRequestObject<any, any, any, any>;



    export type MiddlewareObject = {
        [key: string]: GenericMiddlewareConstructor<any>;
    }


    export type ExtractMiddlewareReturnTypes<Middleware extends GenericMiddlewareConstructor<any>> = 
        InstanceType<Middleware>['_return_type'];

    export type ParsedMiddlewareObject<Mo extends MiddlewareObject> = {
        [K in keyof Mo]: 
            Mo[K] extends GenericMiddlewareConstructor<any>
                ? ExtractMiddlewareReturnTypes<Mo[K]>
            : never;
    };
}