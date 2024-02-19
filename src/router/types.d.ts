declare namespace RouterTypes {

    export interface RouteConfiguration {
        path: Array<String>;
        friendly_name: String;
    }

    export interface NewRouteParameters<
        Body extends Binder.RequiredBody,
        Query extends Binder.RequiredQuery,
    > {
        binders: Array<Binder.Parameters<Body, Query>>;
        configuration: RouteConfiguration;
    }

    export type Method =
        'GET' |
        'POST' |
        'PUT' |
        'DELETE' |
        'PATCH';


    export namespace Binder {


        export type ExtractOptionalType<Type> = Type extends `Optional<${infer U}>` ? U : never;


        export type ConvertStringToType<Type> =
            Type extends 'string' ? String :
            Type extends 'number' ? Number :
            Type extends 'boolean' ? Boolean :
            Type extends `Optional<${string}>` ?
                    ConvertStringToType<ExtractOptionalType<Type>> | undefined :
            never;


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


        export type Request<
            Body,
            Query,
        > = {
            headers: { [key: string]: string; };
            body: Body;
            query: Query;
        };


        export interface Parameters<
            Body,
            Query,
        > {
            method: Method;
            handler?: (request: Request<
                ConvertObjectToType<Body>,
                ConvertObjectToType<Query>
            >) => Promise<any> | any;

            middleware?: Array<Function>;
            required_headers?: RequiredHeaders;
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


        export interface RequiredHeaders {
            // -- Headers are allways strings, no need to use a different type
            [key: string]: string;
        }


        export interface RequiredBody {
            [key: string]: Parameter | RequiredBody;
        }


        export interface RequiredQuery {
            [key: string]: Parameter | RequiredQuery;
        }


        export interface ParserParameterBasic {
            type: BaseParameter | 'custom';
            optional: boolean;
            valid: boolean;
        }

        export type ParserStringDetails = ParserParameterBasic & { value: String; };
        export type ParserNumberDetails = ParserParameterBasic & { value: Number; };
        export type ParserBooleanDetails = ParserParameterBasic & { value: Boolean; };
        export type ParserCustomDetails<Returnable> = ParserParameterBasic & { value: Returnable; };

        export type ParserParameterDetailed<Returnable = unknown> =
            ParserStringDetails |
            ParserNumberDetails |
            ParserBooleanDetails |
            ParserCustomDetails<Returnable>;

        export interface ParserError {
            path: Array<String>;
            message: String;
            parameter: Parameter;
            input: any;
            details: ParserParameterDetailed;
        }
    }
}

