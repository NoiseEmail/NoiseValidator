import { GenericError } from '../error';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Schema } from '../schema/types';



export namespace Middleware {


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
            SchemaType extends Schema.SchemaType,
            SchemaInput extends Schema.SchemaLike<any>,
            ReturnType extends Schema.ParsedSchema<SchemaInput["_schema"]>
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
        set_headers: ([key, value]: [string, string]) => void;
        remove_header: (key: string) => void;
        remove_headers: (keys: Array<string>) => void;

        fastify: {
            request: FastifyRequest;
            reply: FastifyReply;
        }
    };  



    export type MiddlewareConfiguration<
        BodySchema extends Schema.InputSchema,
        QuerySchema extends Schema.FlatSchema,
        HeaderSchema extends Schema.FlatSchema,
    > = {
        body: BodySchema;
        query: QuerySchema;
        headers: HeaderSchema;
    }


    
    export type OptionalMiddlewareConfiguration<
        BodySchema extends Schema.InputSchema,
        QuerySchema extends Schema.FlatSchema,
        HeaderSchema extends Schema.FlatSchema,
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