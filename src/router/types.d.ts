import Fastify, {FastifyReply, FastifyRequest} from "fastify";

declare namespace RouterTypes {

    export interface RouteConfiguration {
        path: Array<String>;
        friendly_name: String;
    }

    export interface NewRouteParameters<
        Body extends Binder.RequiredBody,
        Query extends Binder.RequiredQuery,
        Headers extends Binder.RequiredHeaders
    > {
        binders: Array<Binder.Parameters<Body, Query, Headers>>;
        configuration: RouteConfiguration;
    }

    export type GenericRouteParameters = NewRouteParameters<
        Binder.RequiredBody,
        Binder.RequiredQuery,
        Binder.RequiredHeaders
    >;


    export type Method =
        'GET' |
        'POST' |
        'PUT' |
        'DELETE' |
        'PATCH';



    export namespace Router {

        export type RouteMap = Map<Method, Array<GenericRouteParameters>>

    }


    export namespace Binder {



        /**
         * @name ExtractOptionalType
         * Extracts the type from an `Optional` type
         * eg, `Optional<string>` -> `string`
         *
         * @param {Type} Type - The type to extract from
         * @returns {String} - Returns the type without the `Optional` wrapper
         */
        export type ExtractOptionalType<Type> = Type extends `Optional<${infer U}>` ? U : never;



        /**
         * @name ConvertStringToType
         * Converts a string representation of a type to the actual type
         * eg, 'string' -> String, 'number' -> Number
         *
         * @param {Type} Type - The string representation of the type
         * @returns {String | Number | Boolean | undefined} - Returns the type
         */
        export type ConvertStringToType<Type> =
            Type extends 'string' ? String :
            Type extends 'number' ? Number :
            Type extends 'boolean' ? Boolean :
            Type extends `Optional<${string}>` ?
                    ConvertStringToType<ExtractOptionalType<Type>> | undefined :
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
        export type ConvertObjectToType<Object> = {
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
        export type ConvertHeaderObjectToType<Object> = {
            [Key in keyof Object]:
            Object[Key] extends true ? String :
            Object[Key] extends false ? String | undefined :
            never;
        };



        export type Request<
            Body,
            Query,
            Headers
        > = {
            headers: Headers;
            body: Body;
            query: Query;

            fastify: {
                request: FastifyRequest;
                reply: FastifyReply;
            }
        };


        export interface Parameters<
            Body,
            Query,
            Headers
        > {
            method: Method;
            handler?: (request: Request<
                ConvertObjectToType<Body>,
                ConvertObjectToType<Query>,
                ConvertHeaderObjectToType<Headers>
            >) => Promise<any> | any;

            middleware?: Array<Function>;

            required_headers?: Headers;
            required_body?: Body;
            required_query?: Query;
        }


        export type OptionalDecorator = `Optional<${BaseParameter}>`;
        export type BaseParameter = 'string' | 'number' | 'boolean';
        export type CustomValidator<Returnable = unknown> = (
            value: unknown,
            reject: (reason: string | Error | null | undefined) => void,
        ) => Returnable;
        export type Parameter = BaseParameter | OptionalDecorator | CustomValidator;


        export type RequiredHeaders = { [key: string]: boolean; }
        export interface RequiredBody { [key: string]: Parameter | RequiredBody; }
        export interface RequiredQuery { [key: string]: Parameter | RequiredQuery; }


        export interface ParsedParameter {
            type: BaseParameter | 'custom';
            value: String | Number | Boolean | unknown;
            optional: boolean;
            valid: boolean;
        }

        export interface ParserError {
            path: Array<String>;
            message: String;
            parameter: Parameter;
            input: any;
            details: ParsedParameter;
        }
    }
}

