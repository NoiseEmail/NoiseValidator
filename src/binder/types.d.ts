import { Middleware } from "../middleware/types.d";
import { DynamicURL } from "../route/types.d";
import { SchemaNamespace } from "../schema/types.d";
import { FastifyReply, FastifyRequest, HTTPMethods } from "fastify";



/**
 * The result of `validate_binder_request` function.
 * It just contains the unknown validated date.
 * 
 * Everything is unknow as we don't know what the
 * user passed in.
 */
export type BinderInputValidatorResult<
    BodySchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    QuerySchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    HeadersSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    CookiesSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    DynamicURLSchema extends string
> = {
    body: ObjectModifier.MergeSchemas<BodySchema>,
    query: ObjectModifier.MergeSchemas<QuerySchema>,
    headers: ObjectModifier.MergeSchemas<HeadersSchema>,
    cookies: ObjectModifier.MergeSchemas<CookiesSchema>,
    url: DynamicURL.Extracted<DynamicURLSchema>
};



/**
 * The result of `validate_binder_output` function.
 * This is what the server will send back to the client.
 * It is also validated, but adleast we know that
 * we are sending back an object.
 */
export type BinderOutputValidatorResult = {
    body: object,
    headers: object,
};



/**
 * This is the shape of the object that stores all the 
 * schemas, so that we can just pass this into any func
 * with the data we want to validate.
 */
export type Schemas = {
    input: {
        body: Array<SchemaNamespace.NestedSchemaLike>,
        query: Array<SchemaNamespace.FlatSchmeaLike>,
        headers: Array<SchemaNamespace.FlatSchmeaLike>,
        cookies: Array<SchemaNamespace.FlatSchmeaLike>
    },

    output: {
        body: Array<SchemaNamespace.NestedSchemaLike>,
        headers: Array<SchemaNamespace.FlatSchmeaLike>,
    }
};



export namespace SchemaOutput { 

    export type Split<
        Schemas extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>
    > = ObjectModifier.SplitObject<ObjectModifier.MergeSchemas<Schemas>>;

    
    /**
     * Takes the output from split and checks if the object is optional,
     * eg if there are no keys in 'required' then the object is optional.
     */
    export type IsOptional<
        SplitObject extends { required: object, optional: object }
    > =     
        // -- If the required object has keys, then the object is not optional
        ObjectModifier.HasKeys<SplitObject['required']> extends true ? 'required' : (

            // -- If the optional object has keys, then the object is optional
            ObjectModifier.HasKeys<SplitObject['optional']> extends true ? 'optional' : 

            // -- Else, the object is not needed
            'not_needed'
        )


    /**
     * This function extracts the return types from the schemas and returns an
     * object that only contains the keys needed, eg if body had no schemas, or
     * all data in the body was optional, the body key would also be optional.
     */
    export type Types<
        OutputBodySchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,
        OutputHeadersSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,

        BodyIsOptional = IsOptional<Split<OutputBodySchema>>,
        HeadersIsOptional = IsOptional<Split<OutputHeadersSchema>>
    > =
        (BodyIsOptional extends 'required' ? 
            { body: ObjectModifier.MergeSchemas<OutputBodySchema> } : 
            (BodyIsOptional extends 'optional' ? { body?: ObjectModifier.MergeSchemas<OutputBodySchema> } : {})
        ) &
        (HeadersIsOptional extends 'required' ? 
            { headers: ObjectModifier.MergeSchemas<OutputHeadersSchema> } : 
            (HeadersIsOptional extends 'optional' ? { headers?: ObjectModifier.MergeSchemas<OutputHeadersSchema> } : {})
        );



    export type GenericTypes = {
        body: any,
        headers: any
    }
}



export namespace BinderNamespace {

    export type Configuration<
        Middleware          extends Middleware.MiddlewareObject,
        BodyInputSchema     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        QueryInputSchema    extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        HeadersInputSchema  extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        CookieInputSchema   extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        BodyOutputSchema    extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        HeadersOutputSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>
    > = {
        middleware: Middleware,
        schemas: {
            input: { body: BodyInputSchema, query: QueryInputSchema, headers: HeadersInputSchema, cookies: CookieInputSchema },
            output: { body: BodyOutputSchema, headers: HeadersOutputSchema }
        }
    };



    export type OptionalConfiguration<
        Middleware          extends Middleware.MiddlewareObject,
        BodyInputSchema     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        QueryInputSchema    extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        HeadersInputSchema  extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        CookieInputSchema   extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        BodyOutputSchema    extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        HeadersOutputSchema extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>
    > = {
        middleware?: Middleware,
        schemas?: {
            input?: { body?: BodyInputSchema, query?: QueryInputSchema, headers?: HeadersInputSchema, cookies?: CookieInputSchema },
            output?: { body?: BodyOutputSchema, headers?: HeadersOutputSchema }
        }
    };



    export type GenericOptionalConfiguration = {
        middleware?: Middleware.MiddlewareObject,
        schemas?: {
            input?: { 
                body?: ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>, 
                query?: ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
                headers?: ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
                cookies?: ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>
            },
            output?: { 
                body?: ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>, 
                headers?: ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>
            }
        }
    };
    



    export type CallbackObject<
        Middleware  extends Middleware.MiddlewareObject,
        Body        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        Query       extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        Headers     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        Cookies     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        DynamicURLString extends string
    > = {
        middleware: Middleware.ParsedMiddlewareObject<Middleware>,
        body:       ObjectModifier.MergeSchemas<Body>,
        query:      ObjectModifier.MergeSchemas<Query>,
        headers:    ObjectModifier.MergeSchemas<Headers>,
        cookies:    ObjectModifier.MergeSchemas<Cookies>,
        url:        DynamicURL.Extracted<DynamicURLString>,

        cookie_objects: Map<string, Cookie.Shape>,
        set_cookie:     (name: string, cookie: Cookie.Shape) => void,
        remove_cookie:  (name: string) => void,
        fastify:        { request: FastifyRequest, reply: FastifyReply }
    };



    export type GenericCallbackObject = CallbackObject<
        Middleware.MiddlewareObject,
        ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
        ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
        string
    >;


    
    export type Callback<Data> = (data: Data) => SchemaOutput.GenericTypes | Promise<SchemaOutput.GenericTypes>;



    export type MapObject = {
        callback: (data: GenericCallbackObject) => unknown | Promise<unknown>,
        validate: (request: FastifyRequest, reply: FastifyReply) => Promise<GenericCallbackObject>,
        method: HTTPMethods
    };



    export type Binders = Map<HTTPMethods, Array<MapObject>>;
}



export namespace ArrayModifier {
    
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
     * Allows for A or array of A
     */
    export type ArrayOrSingle<T> = T | Array<T>;      
}



export namespace ObjectModifier {

    export type HasKeys<T> = T extends {} ? keyof T extends never ? false : true : false;
    
    export type UnionToIntersection<U> = 
        (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;        

    export type MergeSchemas<
        Schemas extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>
    > = UnionToIntersection<SchemaNamespace.ReturnType<ArrayModifier.CreateArray<Schemas>[number]>>
    
    

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