import { GenericError } from "../error";
import { Middleware } from "../middleware/types.d";
import { DynamicURL } from "../route/types.d";
import { Schema } from "../schema/types.d";
import { FastifyReply, FastifyRequest, HTTPMethods } from "fastify";


export type BinderInputValidatorResult = {
    body: unknown,
    query: unknown,
    headers: unknown,
    cookies: unknown,
    url: unknown
};


export type BinderOutputValidatorResult = {
    body: object,
    headers: object,
};


export type BinderCallbackReturn = 
    unknown | Promise<unknown>;

export type SchemasValidator = {
    input: {
        body: Array<Schema.SchemaLike<'body'>>,
        query: Array<Schema.SchemaLike<'query'>>,
        headers: Array<Schema.SchemaLike<'headers'>>,
        cookies: Array<Schema.SchemaLike<'cookies'>>
    },

    output: {
        body: Array<Schema.SchemaLike<'body'>>,
        headers: Array<Schema.SchemaLike<'headers'>>,
    }
};


export type BinderMapObject = {
    callback: (data: BinderCallbackObject<
        Middleware.MiddlewareObject, 
        Schema.SchemaLike<Schema.SchemaType>,
        Schema.SchemaLike<Schema.SchemaType>,
        Schema.SchemaLike<Schema.SchemaType>,
        Schema.SchemaLike<Schema.SchemaType>,
        string
    >) => BinderCallbackReturn,

    validate: (request: FastifyRequest, reply: FastifyReply) => 
        Promise<BinderCallbackObject<
            Middleware.MiddlewareObject, 
            Schema.SchemaLike<Schema.SchemaType>,
            Schema.SchemaLike<Schema.SchemaType>,
            Schema.SchemaLike<Schema.SchemaType>,
            Schema.SchemaLike<Schema.SchemaType>,
            string
        > | GenericError>,
    method: HTTPMethods
};


export type BinderCallbackObject<
    Middleware extends Middleware.MiddlewareObject,
    Body extends Schema.SchemaLike<Schema.SchemaType> | Array<Schema.SchemaLike<Schema.SchemaType>>,
    Query extends Schema.SchemaLike<Schema.SchemaType> | Array<Schema.SchemaLike<Schema.SchemaType>>,
    Headers extends Schema.SchemaLike<Schema.SchemaType> | Array<Schema.SchemaLike<Schema.SchemaType>>,
    Cookies extends Schema.SchemaLike<Schema.SchemaType> |  Array<Schema.SchemaLike<Schema.SchemaType>>,
    DynamicURLString extends string
> = {
    middleware: Middleware.ParsedMiddlewareObject<Middleware>,
    body: ObjectModifier.DeepMergeReturnTypes<ObjectModifier.CreateArray<Body>>,
    query: ObjectModifier.DeepMergeReturnTypes<ObjectModifier.CreateArray<Query>>,
    headers: ObjectModifier.DeepMergeReturnTypes<ObjectModifier.CreateArray<Headers>>,
    cookies: ObjectModifier.DeepMergeReturnTypes<ObjectModifier.CreateArray<Cookies>>,
    url: DynamicURL.Extracted<DynamicURLString>,

    cookie_objects: Map<string, Cookie.Shape>,
    set_cookie: (name: string, cookie: Cookie.Shape) => void,
    remove_cookie: (name: string) => void,

    fastify: {
        request: FastifyRequest,
        reply: FastifyReply
    }
};



export type BinderConfigurationSchema<
    // -- Input schemas
    BodyInputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    QueryInputSchema extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    HeadersInputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    CookieInputSchema extends Schema.SchemaLike<'cookies'> | Array<Schema.SchemaLike<'cookies'>>,

    // -- Output schemas
    BodyOutputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    HeadersOutputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
> = {
    input: {
        body?: BodyInputSchema,
        query?: QueryInputSchema,
        headers?: HeadersInputSchema,
        cookies?: CookieInputSchema
    },

    output: {
        body?: BodyOutputSchema,
        headers?: HeadersOutputSchema,
    }
};



type ExtractOutputSchemaHelperSplit<DeepMergeReturnTypes extends object
> = ObjectModifier.SplitObject<ObjectModifier.GetOutputType<DeepMergeReturnTypes, DeepMergeReturnTypes>>

type ExtractOutputSchemaHelperMerge<SplitObject extends { required: object, optional: object }
> = SplitObject['required'] & SplitObject['optional'];

export type ExtractOutputSchema<
    RawSchema extends Schema.SchemaLike<Schema.SchemaType> | Array<Schema.SchemaLike<Schema.SchemaType>>,
> = ExtractOutputSchemaHelperMerge<ExtractOutputSchemaHelperSplit<ObjectModifier.DeepMergeReturnTypes<ObjectModifier.CreateArray<RawSchema>>>>



export type ExtractOutputSchemaTypes<
    OutputBodySchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    OutputHeadersSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    MergedBodySchema = ExtractOutputSchema<OutputBodySchema>,
    MergedHeadersSchema = ExtractOutputSchema<OutputHeadersSchema>,
> = 
    (MergedBodySchema extends object ? { body: MergedBodySchema } : {}) &
    (MergedHeadersSchema extends object ? { headers: MergedHeadersSchema } : {})




export type OptionalBinderConfiguration<
    // -- Middleware
    Middleware extends Middleware.MiddlewareObject,

    // -- Input schemas
    BodyInputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    QueryInputSchema extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    HeadersInputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    CookieInputSchema extends Schema.SchemaLike<'cookies'> | Array<Schema.SchemaLike<'cookies'>>,

    // -- Output schemas
    BodyOutputSchema extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    HeadersOutputSchema extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
> = {
    middleware?: Middleware,
    schemas?: Partial<BinderConfigurationSchema<
        BodyInputSchema, 
        QueryInputSchema, 
        HeadersInputSchema, 
        CookieInputSchema,
        
        BodyOutputSchema,
        HeadersOutputSchema
    >>
};



export type BinderMap = Map<HTTPMethods, Array<BinderMapObject>>;



export namespace ObjectModifier {


    /**
     * If the input is an array, return true, otherwise return false
     */
    export type IsArray<T> = T extends Array<unknown> ? true : false;



    /**
     * If the input is an array, return the input, otherwise return an array
     * with the input as the only element.
     */
    export type CreateArray<T> = T extends Array<unknown> ? T : [T];


    
    /**
     * Recursively merges deeply nested properties of an object type `T`.
     * If a property is an object, it will be merged recursively.
     * Otherwise, the property type is preserved.
     * If `T` is not an object, it results in `never`.
     */
    export type DeepMerge<T> = T extends object
        ? {
            [K in keyof T]: T[K] extends infer U
                ? U extends object
                    ? DeepMerge<U>
                        : U
                            : never;
            }
        : never;



    /**
     * Given an array of schemas, it will return the return type of the
     * schemas.
     * 
     * IN: { a: { _return_type: string }, b: { _return_type: number } }
     * OUT: { a: string, b: number }
     */
    export type DeepMergeReturnTypes<
        Schemas extends Array<Schema.SchemaLike<Schema.SchemaType>>
    > = DeepMerge<
        {
            [K in keyof Schemas[number]]: Schemas[number][K] extends infer U
            ? U extends Schema.SchemaLike<Schema.SchemaType>
                ? U extends { _return_type: infer R }
                    ? R
                        : never
                            : DeepMerge<U>
            : never;
        }['_return_type']
    >;



    /**
     * Check if the input is optional, if it is, return true, otherwise return false
     */
    export type IsOptional<Input> = Input extends void | undefined ? true : false;



    /**
     * If the input extends { [x: string]: never; }
     * than the output is void, otherwise the output is the input
     */
    export type GetOutputType<
        Input extends Object,
        ParsedOutput extends Object
    > = Input extends { [x: string]: never; } ? void : ParsedOutput;



    //
    // -- Man, I really fucking hated making these.
    //



    /**
     * DeepExcludeNonOptional recursively excludes non-optional properties from an object type `T`.
     * If a property is an object, it will be processed recursively.
     * If a property is not optional (does not include undefined), it will be excluded (results in never).
     */
    export type DeepExcludeNonOptional<T> = {
        [K in keyof T]: 
            T[K] extends object ? DeepExcludeNonOptional<T[K]> : 
                Extract<T[K], undefined> extends never ? never : T[K]
    };



    /**
     * DeepExcludeOptional recursively excludes optional properties from an object type `T`.
     * If a property is an object, it will be processed recursively.
     * If a property is optional (includes undefined), it will be excluded (results in never).
     */
    export type DeepExcludeOptional<T> = {
        [K in keyof T]: 
            T[K] extends object ? DeepExcludeOptional<T[K]> : 
                Extract<T[K], undefined> extends never ? T[K] : never
    };



    /**
     * DeepOmit recursively omits properties of a certain type from an object type `T`.
     * If a property is an object, it will be processed recursively.
     * If a property is of type `OmitType`, it will be omitted (results in never).
     */
    export type DeepOmit<T, OmitType> = {
        [K in keyof T as T[K] extends OmitType ? never : K]: 
            T[K] extends object ? DeepOmit<T[K], OmitType> : T[K];
    };
    


    /**
     * DeepPartial makes all properties in `T` optional and allows undefined.
     * If a property is an object, it will be processed recursively.
     */
    export type DeepPartial<T> = {
        [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] | undefined;
    };



    /**
     * Given an object, it will return a new object with all the keys
     * that have a value of `undefined` Marked as optional.
     * 
     * @example
     * type Input = {
     *   a: string,
     *   b: undefined | number,
     * }
     * 
     * type Output = OmitNonOptional<Input>;
     * Output = {
     *    b: number | undefined
     * }
     */
    export type DeepOptional<Input> = DeepPartial<DeepOmit<DeepExcludeNonOptional<Input>, never>>;



    /**
     * Given an object, it will return a new object with all the keys
     * that are optional removed.
     * 
     * @example
     * type Input = {
     *   a: string,
     *   b?: number,
     * }
     * 
     * type Output = OmitOptional<Input>;
     * Output = {
     *   a: string
     * }
     */
    export type DeepRequired<Input> = DeepOmit<DeepExcludeOptional<Input>, undefined>;


    
    /**
     * Given an object, it will return an object with two keys:
     * `required` and `optional`. The `required` key will contain all the keys
     * that are required, and the `optional` key will contain all the keys that
     * are optional.
     * 
     * @example
     * type Input = {
     *  a: string,
     *  b?: number | undefined,
     * }
     * 
     * type Output = SplitObject<Input>;
     * Output = {
     *    required: { a: string },
     *    optional: { b: number | undefined }
     * }
     */
    export type SplitObject<Input> = {
        required: DeepRequired<Input>,
        optional: DeepOptional<Input>
    };
}



export namespace Cookie {

    /**
     * Web docs:
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
     */
    export type SameSite = 'strict' | 'lax' | 'none';



    /**
     * Web docs:
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
     */
    export type Options = {
        domain: string,
        expires: Date,
        http_only: boolean,
        max_age: number,
        partitioned: boolean,
        path: string,
        secure: boolean,
        same_site: SameSite
    }



    /**
     * This is the shape of a cookie when setting it server-side.
     */
    export type Shape = {
        value: string,
        options: Partial<Options>
    };
}