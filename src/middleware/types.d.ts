import { Cookie } from 'noise_validator/src/binder/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from 'noise_validator/src/schema/types';
import { RequestProcessor } from 'noise_validator/src/route';



export namespace MiddlewareNamespace {


    export class GenericMiddlewareLike<
        ReturnType extends unknown = unknown,
        RequestObject extends AnyMiddlewareRequestObject = AnyMiddlewareRequestObject
    > {
        _return_type: ReturnType;

        public constructor(request_object: RequestObject);
        protected _request_object: RequestObject;

        protected validate_input<
            SchemaType extends 'body' | 'query' | 'headers' | 'cookies',
            SchemaInput extends SchemaNamespace.SchemaLike,
            ReturnType extends SchemaNamespace.ParsedSchema<SchemaInput["_schema"]>
        >(  
            input_type: SchemaType,
            schema: SchemaInput
        ): Promise<ReturnType>

        protected handler: (input_value: RequestObject) => Promise<ReturnType>
        public execute: () => Promise<{ data: ReturnType, success: true } | { data: GenericError, success: false }>;
        public static get name(): string;
    }


    
    export enum MiddlewareRuntime {
        'BEFORE' = 'B',
        'AFTER' = 'A',
    }



    export type GenericMiddlewareConstructor<
        ReturnType extends unknown = unknown,
        RequestObject extends AnyMiddlewareRequestObject = AnyMiddlewareRequestObject
    > = new (request_object: RequestObject) => GenericMiddlewareLike<ReturnType, RequestObject>;



    export type MiddlewareRequestObject<
        BodySchema, 
        QuerySchema, 
        HeaderSchema
    > = {
        request_processor: RequestProcessor;

        headers: HeaderSchema;
        body: BodySchema;
        query: QuerySchema;

        set_header: (key: string, value: string, on?: ExecuteOn) => void;
        remove_header: (key: string) => void;

        set_cookie: (name: string, cookie: Cookie.Shape, on?: ExecuteOn) => void;
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
        MiddlewareRequestObject<unknown, unknown, unknown>;



    export type MiddlewareObject = {
        [key: string]: GenericMiddlewareConstructor<unknown>;
    }


    export type ExtractMiddlewareReturnTypes<Middleware extends GenericMiddlewareConstructor<any>> = 
        InstanceType<Middleware>['_return_type'];

    export type ParsedMiddlewareObject<Mo extends MiddlewareObject> = {
        [K in keyof Mo]: 
            Mo[K] extends GenericMiddlewareConstructor<any>
                ? ExtractMiddlewareReturnTypes<Mo[K]>
            : never;
    };



    /**
     * This type represents the different ways that things can be executed
     * in a middleware, as you might want to execute something regardless of
     * whether the middleware was successful or not.
     * 
     * - `on-success` - Only execute if the middleware was successful
     * - `on-failure` - Only execute if the middleware failed
     * - `on-both`    - Execute regardless of the outcome
     */
    export type ExecuteOn =
        'on-success' |
        'on-failure' |
        'on-both';



    export type MiddlewareValidationResult = {
        on_success_cookies: Map<string, Cookie.Shape>,
        on_success_headers: Map<string, string>,

        on_failure_cookies: Map<string, Cookie.Shape>,
        on_failure_headers: Map<string, string>,

        on_both_cookies: Map<string, Cookie.Shape>,
        on_both_headers: Map<string, string>,
    } & (
        { success: true, data: unknown } |
        { success: false, data: GenericError }
    );



    export type MiddlewareValidationMap = Map<string, MiddlewareValidationResult>;
}