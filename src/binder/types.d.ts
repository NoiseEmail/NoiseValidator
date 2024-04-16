import { GenericError } from "../error";
import { Middleware } from "../middleware/types.d";
import { DynamicURL } from "../route/types.d";
import { Schema } from "../schema/types.d";
import { FastifyReply, FastifyRequest, HTTPMethods } from "fastify";


export type BinderValidatorResult = {
    body: unknown,
    query: unknown,
    headers: unknown,
    url: unknown
};


export type BinderCallbackReturn = 
    unknown | Promise<unknown>;

export type SchemasValidator = {
    body: Array<Schema.SchemaLike<'body'>>,
    query: Array<Schema.SchemaLike<'query'>>,
    headers: Array<Schema.SchemaLike<'headers'>>,
    output: Array<Schema.SchemaLike<Schema.SchemaType>>
};


export type BinderMapObject = {
    callback: (data: BinderCallbackObject<
        Middleware.MiddlewareObject, 
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
            string
        > | GenericError>,
    method: HTTPMethods
};


export type BinderCallbackObject<
    Middleware extends Middleware.MiddlewareObject,
    Body extends 
        Schema.SchemaLike<Schema.SchemaType> | 
        Array<Schema.SchemaLike<Schema.SchemaType>>,

    Query extends 
        Schema.SchemaLike<Schema.SchemaType> | 
        Array<Schema.SchemaLike<Schema.SchemaType>>,

    Headers extends 
        Schema.SchemaLike<Schema.SchemaType> | 
        Array<Schema.SchemaLike<Schema.SchemaType>>,

    DynamicURLString extends string
> = {
    middleware: Middleware.ParsedMiddlewareObject<Middleware>,
    body: DeepMergeReturnTypes<CreateArray<Body>>,
    query: DeepMergeReturnTypes<CreateArray<Query>>,
    headers: DeepMergeReturnTypes<CreateArray<Headers>>,
    url: DynamicURL.Extracted<DynamicURLString>,

    fastify: {
        request: FastifyRequest,
        reply: FastifyReply
    }
};



export type BinderConfigurationSchema<
    // -- Input schemas
    BodyInputSchema extends 
        Schema.SchemaLike<'body'> | 
        Array<Schema.SchemaLike<'body'>>,

    QueryInputSchema extends 
        Schema.SchemaLike<'query'> | 
        Array<Schema.SchemaLike<'query'>>,

    HeadersInputSchema extends 
        Schema.SchemaLike<'headers'> | 
        Array<Schema.SchemaLike<'headers'>>,

    // -- Output schemas
    BodyOutputSchema extends
        Schema.SchemaLike<'body'> | 
        Array<Schema.SchemaLike<'body'>>,

    HeadersOutputSchema extends
        Schema.SchemaLike<'headers'> | 
        Array<Schema.SchemaLike<'headers'>>,
> = {
    input: {
        body?: BodyInputSchema,
        query?: QueryInputSchema,
        headers?: HeadersInputSchema
    },

    output: {
        body?: BodyOutputSchema,
        headers?: HeadersOutputSchema
    }
};



type ExtractOutputSchemaHelperSplit<
    DeepMergeReturnTypes extends object
> = SplitObject<GetOutputType<DeepMergeReturnTypes, DeepMergeReturnTypes>>

type ExtractOutputSchemaHelperMerge<
    SplitObject extends { required: object, optional: object }
> = SplitObject['required'] & SplitObject['optional'];

export type ExtractOutputSchema<
    RawSchema extends
        Schema.SchemaLike<Schema.SchemaType> | 
        Array<Schema.SchemaLike<Schema.SchemaType>>,
> = ExtractOutputSchemaHelperMerge<
        ExtractOutputSchemaHelperSplit<
            DeepMergeReturnTypes<CreateArray<RawSchema>>>>



export type ExtractOutputSchemaTypes<
    OutputBodySchema extends
        Schema.SchemaLike<'body'> | 
        Array<Schema.SchemaLike<'body'>>,

    OutputHeadersSchema extends
        Schema.SchemaLike<'headers'> | 
        Array<Schema.SchemaLike<'headers'>>,

    MergedBodySchema = ExtractOutputSchema<OutputBodySchema>,
    MergedHeadersSchema = ExtractOutputSchema<OutputHeadersSchema>
> = 
    (MergedBodySchema extends object ? { body: MergedBodySchema } : {}) &
    (MergedHeadersSchema extends object ? { headers: MergedHeadersSchema } : {});




export type OptionalBinderConfiguration<
     // -- Middleware
    Middleware extends Middleware.MiddlewareObject,

    // -- Input schemas
    BodyInputSchema extends 
        Schema.SchemaLike<'body'> | 
        Array<Schema.SchemaLike<'body'>>,

    QueryInputSchema extends 
        Schema.SchemaLike<'query'> | 
        Array<Schema.SchemaLike<'query'>>,

    HeadersInputSchema extends 
        Schema.SchemaLike<'headers'> | 
        Array<Schema.SchemaLike<'headers'>>,

    // -- Output schemas
    BodyOutputSchema extends
        Schema.SchemaLike<'body'> | 
        Array<Schema.SchemaLike<'body'>>,

    HeadersOutputSchema extends
        Schema.SchemaLike<'headers'> | 
        Array<Schema.SchemaLike<'headers'>>,
> = {
    middleware?: Middleware,
    schemas?: Partial<BinderConfigurationSchema<
        BodyInputSchema, 
        QueryInputSchema, 
        HeadersInputSchema, 
        
        BodyOutputSchema,
        HeadersOutputSchema
    >>
};




export type IsArray<T> = T extends Array<unknown> ? true : false;
export type CreateArray<T> = T extends Array<unknown> ? T : [T];


type DeepMerge<T> = T extends object
    ? {
        [K in keyof T]: T[K] extends infer U
            ? U extends object
                ? DeepMerge<U>
                    : U
                        : never;
        }
    : never;

type DeepMergeReturnTypes<
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




export type BinderMap = Map<HTTPMethods, Array<BinderMapObject>>;
type IsOptional<Input> = Input extends void | undefined ? true : false;



/**
 * @name GetOutputType
 * @description If the input extends { [x: string]: never; }
 * than the output is void, otherwise the output is the input
 */
export type GetOutputType<
    Input extends Object,
    ParsedOutput extends Object
> =
    Input extends { [x: string]: never; }
        ? void
        : ParsedOutput;



// -- Man, I really fucking hated making these.
export type DeepExcludeNonOptional<T> = {
    [K in keyof T]: 
        T[K] extends object ? DeepExcludeNonOptional<T[K]> : 
            Extract<T[K], undefined> extends never ? never : T[K]
}

export type DeepExcludeOptional<T> = {
    [K in keyof T]: 
        T[K] extends object ? DeepExcludeOptional<T[K]> : 
            Extract<T[K], undefined> extends never ? T[K] : never
}

export type DeepOmit<T, OmitType> = {
    [K in keyof T as T[K] extends OmitType ? never : K]: 
        T[K] extends object ? DeepOmit<T[K], OmitType> : T[K];
};
  
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] | undefined;
};



/**
 * @name DeepOptional
 * @description Given an object, it will return a new object with all the keys
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
 * @name DeepRequired
 * @description Given an object, it will return a new object with all the keys
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
 * @name SplitObject
 * @description Given an object, it will return an object with two keys:
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