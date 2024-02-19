import Fastify, {FastifyReply, FastifyRequest} from "fastify";
import BinderClass from "./binder";

declare namespace RouterTypes {

    export interface RouteConfiguration {
        path: Array<String>;
        friendly_name: String;
    }

    export type Method =
        'GET' |
        'POST' |
        'PUT' |
        'DELETE' |
        'PATCH';


    export namespace Router {

        export type RouteMap = Map<Method, Array<RouterTypes.Binder.Generic>>


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


        export type Generic = BinderClass<
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

        export interface RouteCompatibleObject {
            body: ConvertObjectToType<RequiredBody>;
            query: ConvertObjectToType<RequiredQuery>;
            headers: ConvertHeaderObjectToType<RequiredHeaders>;
            binder: Generic;
        }


        export type OptionalDecorator = `Optional<${BaseParameter}>`;
        export type BaseParameter = 'string' | 'number' | 'boolean';
        export type TypeParameter = String | Number | Boolean;
        export type CustomValidator<Returnable = unknown> = (
            value: unknown,
            reject: (reason: string | Error | null | undefined) => void,
        ) => Returnable;
        export type Parameter = BaseParameter | TypeParameter| OptionalDecorator | CustomValidator;


        export type RequiredHeaders = { [key: string]: boolean; }
        export interface RequiredBody { [key: string]: Parameter | RequiredBody; }
        export interface RequiredQuery { [key: string]: Parameter | RequiredQuery; }


        export interface ParsedParameter {
            type: BaseParameter | 'custom';
            value: String | Number | Boolean | unknown;
            optional: boolean;
            valid: boolean;
        }
    }
}

