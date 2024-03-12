import { GenericError } from '../error/types';
import { LogFunctions, LogObject } from '../logger/types';
import {FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';

export namespace Middleware {


    export class GenericMiddlewareLike<
        ReturnType extends unknown = unknown,
        RequestObject extends AnyMiddlewareRequestObject = AnyMiddlewareRequestObject
    > {
        public constructor(
            _input_value: RequestObject,
            _on_invalid: (error: GenericError.GenericErrorLike) => void,
            _on_valid: (result: ReturnType) => void
        );

        protected _input_value: RequestObject;
        protected _on_invalid: (error: GenericError.GenericErrorLike) => void;
        protected _on_valid: (result: ReturnType) => void;

        protected handler: (
            input_value: RequestObject,
            invalid: (error: GenericError.GenericErrorLike) => void,
            valid: (result: ReturnType) => void
        ) => 
            ReturnType | 
            Promise<ReturnType> |  
            Promise<GenericError.GenericErrorLike> | 
            GenericError.GenericErrorLike;

        protected invalid: (error: GenericError.GenericErrorLike | string) => GenericError.GenericErrorLike;
        protected valid: (result: ReturnType) => void;

        public execute: () => Promise<void>;
        public static get name(): string;
    }



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



    export type AnyMiddlewareRequestObject = 
        MiddlewareRequestObject<any, any, any, any>;
}