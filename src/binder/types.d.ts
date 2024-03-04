import { DynamicURL, Router } from '../router/types';
import BinderClass from './binder';
import {FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';
import { Middleware } from '../middleware/types';

declare namespace Binder {

    type Configuration<
        MiddlewareDict extends Middleware.Dict,
        BodySchema extends Paramaters.NestedObject,
        QuerySchema extends Paramaters.FlatObject,
        HeaderSchema extends Paramaters.FlatObject,
        Request extends Binder.Request<any, any, any, any, any>
    > = {
        method: HTTPMethods,
        handler: Router.Executable<Request>,
        body_schema: BodySchema,
        query_schema: QuerySchema,
        header_schema: HeaderSchema,
        middleware: MiddlewareDict,
    };



    type OptionalConfiguration<
        MiddlewareDict extends Middleware.Dict,
        BodySchema extends Paramaters.NestedObject,
        QuerySchema extends Paramaters.FlatObject,
        HeaderSchema extends Paramaters.FlatObject,
        Request extends Binder.Request<any, any, any, any, any>
    > = Partial<Configuration<MiddlewareDict, BodySchema, QuerySchema, HeaderSchema, Request>>;



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
            Object[Key] extends Paramaters.CustomValidatorFunction<infer R> ? R :

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



    /**
     * @name ArrayToObject
     * Converts an array of strings to an object
     *
     * @param {Array<string>} Array - The array to convert
     * @returns {Object} - Returns the converted object
     */
    type ArrayToObject<Arr extends Array<string>> = {
        [Key in Arr[number]]: string;
    }



    type Request<
        DynamicUrl, 
        BodySchema, 
        QuerySchema, 
        HeaderSchema,
        MiddlewareData
    > = {
        headers: HeaderSchema;
        body: BodySchema;
        query: QuerySchema;
        url: DynamicUrl;
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


    type Generic = BinderClass<
        Middleware.Dict,
        Middleware.Extract<Middleware.Dict>,
        any,
        Paramaters.Body,
        Paramaters.Query,
        Paramaters.Headers,
        ConvertObjectToType<Paramaters.Body>,
        ConvertObjectToType<Paramaters.Query>,
        ConvertHeaderObjectToType<Paramaters.Headers>,
        DynamicURL.Extracted<any>,
        Request<
            DynamicURL.Extracted<any>,
            ConvertObjectToType<Paramaters.Body>,
            ConvertObjectToType<Paramaters.Query>,
            ConvertHeaderObjectToType<Paramaters.Headers>,
            Middleware.Extract<Middleware.Dict>
        >
    >;

    type Any = BinderClass<any, any, any, any, any, any, any, any, any, any, any>;

}



declare namespace Paramaters {

    /**
     * @name Primative  
     * The base primative types
     * 
     * @returns {String} - Typechecked primative type
     */
    type Primative = 'string' | 'number' | 'boolean';


    /**
     * @name TypedPrimative
     * The base primative types represented as their
     * typescript types
     */
    type TypedPrimative = String | Number | Boolean;


    /**
     * @name Optional
     * Optional type decorator, used to define a parameter as optional
     * 
     * eg, `Optional<string>` -> `string | undefined`
     * eg, `Optional<number>` -> `number | undefined`
     * eg, `Optional<boolean>` -> `boolean | undefined`
     * 
     * @returns {String} - Typechecked optional type
     */
    type Optional = `Optional<${Primative}>`;


    /**
     * @name CustomValidatorFunction
     * The base parameter types
     */
    type CustomValidatorFunction<Returnable = unknown> = (
        value: unknown,
        reject: (reason: string | Error | null | undefined) => void,
    ) => Returnable;

    type CustomValidatorWrapper<Returnable = unknown> = {
        function: CustomValidatorFunction<Returnable>,
        path: Array<string>,
        belongs_to: string,
        type: 'Binder' | 'Middleware'
    };

    type Headers = { [key: string]: boolean; }
    type Body = { [key: string]: | Optional | Primative | CustomValidatorFunction | Body; }
    type Query = { [key: string]: | Optional | Primative | CustomValidatorFunction; }


    type WrappedBody = { [key: string]: | Optional | Primative | Array<CustomValidatorWrapper> | WrappedBody; }
    type WrappedQuery = { [key: string]: | Optional | Primative | Array<CustomValidatorWrapper>; }
    type Wrapped = WrappedBody | WrappedQuery;


    type NestedObject = Body;
    type FlatObject = Query | Headers;


    type Parsed = {
        type: Primative | 'custom';
        value: String | Number | Boolean | unknown;
        optional: boolean;
        valid: boolean;
    }


    type SchemaDict = {
        body: Array<WrappedBody>;
        query: Array<WrappedQuery>;
        headers: Array<Headers>;
    };

    type ObjectParaseResult<Input> = {
        parsed_object: Binder.ConvertObjectToType<Input>;
        custom_validators: Map<string, Array<{
            path: Array<string>;
            value: unknown;
            type: 'Binder' | 'Middleware';
        }>>;
    }

    /**
     * @name all
     * All of the possible parameter types
     */
    type All =
        Primative | 
        Optional |
        CustomValidatorFunction;
}
