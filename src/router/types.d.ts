import {FastifyReply, FastifyRequest, HTTPMethods} from "fastify";
import BinderClass from "./binder";
import RouterError from "./error";
import exp from "node:constants";

declare namespace RouterTypes {

    interface RouteConfiguration {
        path: Array<String>;
        friendly_name: String;
    }

    namespace Router {

        type RouteMap = Map<HTTPMethods, Array<RouterTypes.Binder.Generic>>

        interface RouteCompatibleObject {
            body: Binder.ConvertObjectToType<Binder.RequiredBody>;
            query: Binder.ConvertObjectToType<Binder.RequiredQuery>;
            headers: Binder.ConvertHeaderObjectToType<Binder.RequiredHeaders>;
            binder: Binder.Generic;
        }

        interface ReturnableObject {
            status: StatusBuilder.Status | number;
            body?: any;
            content_type?: string;
        }

        type ExecutableReturnable =
            Promise<ReturnableObject> |
            Promise<RouterError> |
            Promise<void> |
            ReturnableObject |
            RouterError |
            void;

        type Executable<
            Request extends Binder.Request<any, any, any>
        > = (request: Request) => ExecutableReturnable;

        namespace StatusBuilder {

            type Category =
                'SUCCESS' |
                'REDIRECT' |
                'CLIENT_ERROR' |
                'CLIENT' |
                'SERVER_ERROR' |
                'SERVER';

            type SuccessStatus =
                { code: 200, name: 'OK' } |
                { code: 201, name: 'CREATED' } |
                { code: 202, name: 'ACCEPTED' } |
                { code: 204, name: 'NO_CONTENT' } |
                { code: 205, name: 'RESET_CONTENT' } |
                { code: 206, name: 'PARTIAL_CONTENT' } |
                { code: 207, name: 'MULTI_STATUS' } |
                { code: 208, name: 'ALREADY_REPORTED' };

            type RedirectStatus =
                { code: 300, name: 'MULTIPLE_CHOICES' } |
                { code: 301, name: 'MOVED_PERMANENTLY' } |
                { code: 302, name: 'FOUND' } |
                { code: 303, name: 'SEE_OTHER' } |
                { code: 304, name: 'NOT_MODIFIED' } |
                { code: 305, name: 'USE_PROXY' } |
                { code: 306, name: 'SWITCH_PROXY' } |
                { code: 307, name: 'TEMPORARY_REDIRECT' } |
                { code: 308, name: 'PERMANENT_REDIRECT' };

            type ClientErrorStatus =
                { code: 400, name: 'BAD_REQUEST' } |
                { code: 401, name: 'UNAUTHORIZED' } |
                { code: 402, name: 'PAYMENT_REQUIRED' } |
                { code: 403, name: 'FORBIDDEN' } |
                { code: 404, name: 'NOT_FOUND' } |
                { code: 405, name: 'METHOD_NOT_ALLOWED' } |
                { code: 406, name: 'NOT_ACCEPTABLE' } |
                { code: 407, name: 'PROXY_AUTHENTICATION_REQUIRED' } |
                { code: 408, name: 'REQUEST_TIMEOUT' } |
                { code: 409, name: 'CONFLICT' } |
                { code: 410, name: 'GONE' } |
                { code: 411, name: 'LENGTH_REQUIRED' } |
                { code: 412, name: 'PRECONDITION_FAILED' } |
                { code: 413, name: 'PAYLOAD_TOO_LARGE' } |
                { code: 414, name: 'URI_TOO_LONG' } |
                { code: 415, name: 'UNSUPPORTED_MEDIA_TYPE' } |
                { code: 416, name: 'RANGE_NOT_SATISFIABLE' } |
                { code: 417, name: 'EXPECTATION_FAILED' } |
                { code: 418, name: 'IM_A_TEAPOT' } |
                { code: 421, name: 'MISDIRECTED_REQUEST' } |
                { code: 422, name: 'UNPROCESSABLE_ENTITY' } |
                { code: 423, name: 'LOCKED' } |
                { code: 424, name: 'FAILED_DEPENDENCY' } |
                { code: 425, name: 'TOO_EARLY' } |
                { code: 426, name: 'UPGRADE_REQUIRED' } |
                { code: 428, name: 'PRECONDITION_REQUIRED' } |
                { code: 429, name: 'TOO_MANY_REQUESTS' } |
                { code: 431, name: 'REQUEST_HEADER_FIELDS_TOO_LARGE' } |
                { code: 451, name: 'UNAVAILABLE_FOR_LEGAL_REASONS' };

            type ServerErrorStatus =
                { code: 500, name: 'INTERNAL_SERVER_ERROR' } |
                { code: 501, name: 'NOT_IMPLEMENTED' } |
                { code: 502, name: 'BAD_GATEWAY' } |
                { code: 503, name: 'SERVICE_UNAVAILABLE' } |
                { code: 504, name: 'GATEWAY_TIMEOUT' } |
                { code: 505, name: 'HTTP_VERSION_NOT_SUPPORTED' } |
                { code: 506, name: 'VARIANT_ALSO_NEGOTIATES' } |
                { code: 507, name: 'INSUFFICIENT_STORAGE' } |
                { code: 508, name: 'LOOP_DETECTED' } |
                { code: 510, name: 'NOT_EXTENDED' } |
                { code: 511, name: 'NETWORK_AUTHENTICATION_REQUIRED' };



            type Success =
                `${SuccessStatus['code']}_${SuccessStatus['name']}`;

            type Redirect =
                `${RedirectStatus['code']}_${RedirectStatus['name']}`;

            type ClientError =
                `${ClientErrorStatus['code']}_${ClientErrorStatus['name']}`;

            type ServerError =
                `${ServerErrorStatus['code']}_${ServerErrorStatus['name']}`;



            type Status =
                Success |
                Redirect |
                ClientError |
                ServerError;
        }
    }



    namespace DynamicURL {

        type StartsWithColon<str extends string> =
            str extends `:${infer _}` ? true : false;

        type RemoveStartingColons<str extends string> =
            StartsWithColon<str> extends true ?
            str extends `:${infer right}` ? RemoveStartingColons<right> :
            str : str;

        type HasColonLeft<str extends string> =
            str extends `${infer _}:${infer __}` ? true : false;

        type Extract<str extends string, res extends Array<string> = []> =
            HasColonLeft<str> extends false ? res :
            str extends `${infer l}:${infer r}` ?
            HasColonLeft<r> extends false ? [...res, r] :
            StartsWithColon<r> extends true ? Extract<RemoveStartingColons<r>, res> :
            r extends `${infer l2}:${infer r2}` ? Extract<`:${r2}`, [...res, l2]> :
            never : never;


        type test = Extract<'ss:aaa::bbb:cccc'>
    }

    namespace Binder {



        /**
         * @name ExtractOptionalType
         * Extracts the type from an `Optional` type
         * eg, `Optional<string>` -> `string`
         *
         * @param {Type} Type - The type to extract from
         * @returns {String} - Returns the type without the `Optional` wrapper
         */
        type ExtractOptionalType<Type> = Type extends `Optional<${infer U}>` ? U : never;



        /**
         * @name ConvertStringToType
         * Converts a string representation of a type to the actual type
         * eg, 'string' -> String, 'number' -> Number
         *
         * @param {Type} Type - The string representation of the type
         * @returns {String | Number | Boolean | undefined} - Returns the type
         */
        type ConvertStringToType<Type> =
            Type extends 'string' ? String :
            Type extends 'number' ? Number :
            Type extends 'boolean' ? Boolean :

            Type extends `Optional<${string}>` ?
                    ConvertStringToType<ExtractOptionalType<Type>> | undefined :

            Type extends String ? String :
            Type extends Number ? Number :
            Type extends Boolean ? Boolean :
            never;



        /**
         * @name ConvertObjectToType
         * Converts an object representation of types to the actual types
         * eg, { name: 'string', age: 'number' } -> { name: String, age: Number }
         *
         * This is a recursive type, so it will also convert nested objects
         *
         * @param {Object} Object - The object to convert
         * @returns {Object} - Returns the converted object
         */
        type ConvertObjectToType<Object> = {
            [Key in keyof Object]:
                // -- Base types
                Object[Key] extends 'string' ? String :
                Object[Key] extends 'number' ? Number :
                Object[Key] extends 'boolean' ? Boolean :

                // -- Special types
                Object[Key] extends `Optional<${string}>` ? ConvertStringToType<Object[Key]> :
                Object[Key] extends CustomValidator<infer R> ? R :

                // -- Nested objects (Recursion is typescript is so weird, but cool)
                Object[Key] extends object ? ConvertObjectToType<Object[Key]> :

                // -- These need to be here are all of the above are strings, therefore
                //     if this is first, it will always be true
                Object[Key] extends String ? String :
                Object[Key] extends Number ? Number :
                Object[Key] extends Boolean ? Boolean :
                never;
        };



        /**
         * @name ConvertHeaderObjectToType
         * Converts an object representation of types to the actual types
         * eg, { name: true, age: false } -> { name: string, age?: string }
         *
         * This is not a recursive type, as headers are not nested, and
         * at that, headers can only be strings.
         *
         * @param {Object} Object - The object to convert
         * @returns {Object} - Returns the converted object
         */
        type ConvertHeaderObjectToType<Object> = {
            [Key in keyof Object]:
            Object[Key] extends true ? String :
            Object[Key] extends false ? String | undefined :
            never;
        };



        type Request<
            Body,
            Query,
            Headers
        > = {
            headers: Headers;
            body: Body;
            query: Query;

            set_header: (key: string, value: string) => void;
            set_headers: ([key, value]: [string, string]) => void;
            remove_header: (key: string) => void;
            remove_headers: (keys: Array<string>) => void;

            fastify: {
                request: FastifyRequest;
                reply: FastifyReply;
            }
        };


        type Generic = BinderClass<
            RequiredBody,
            RequiredQuery,
            RequiredHeaders,
            ConvertObjectToType<RequiredBody>,
            ConvertObjectToType<RequiredQuery>,
            ConvertHeaderObjectToType<RequiredHeaders>,
            Request<
                ConvertObjectToType<RequiredBody>,
                ConvertObjectToType<RequiredQuery>,
                ConvertHeaderObjectToType<RequiredHeaders>
            >
        >;

        type Any = BinderClass<any, any, any, any, any, any, any>



        type OptionalDecorator = `Optional<${BaseParameter}>`;
        type BaseParameter = 'string' | 'number' | 'boolean';
        type TypeParameter = String | Number | Boolean;
        type CustomValidator<Returnable = unknown> = (
            value: unknown,
            reject: (reason: string | Error | null | undefined) => void,
        ) => Returnable;
        type Parameter = BaseParameter | TypeParameter| OptionalDecorator | CustomValidator;


        type RequiredHeaders = { [key: string]: boolean; }
        interface RequiredBody { [key: string]: Parameter | RequiredBody; }
        interface RequiredQuery { [key: string]: Parameter; }


        interface ParsedParameter {
            type: BaseParameter | 'custom';
            value: String | Number | Boolean | unknown;
            optional: boolean;
            valid: boolean;
        }
    }
}

