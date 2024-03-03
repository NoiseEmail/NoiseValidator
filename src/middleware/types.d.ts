import { Binder, Paramaters } from '../binder/types';
import RouterError from '../router/error';
import CompileSchema from '../binder/schema';

declare namespace Middleware {

    /**
     * @name Function
     * The middleware function type
     */
    type Function<
        MiddlewareData extends any,
        DynamicUrl extends Paramaters.FlatObject,
        BodySchema extends Paramaters.NestedObject,
        QuerySchema extends Paramaters.FlatObject,
        HeaderSchema extends Paramaters.FlatObject
    > = (
        request: Binder.Request<
            DynamicUrl,
            BodySchema,
            QuerySchema,
            HeaderSchema,
            MiddlewareData
        >,

        next: () => Promise<MiddlewareData | void> | MiddlewareData | void,
        stop: (error: RouterError) => void
        
    ) => Promise<void> | void;



    type Class<
        MiddlewareData extends Middleware.Dict,

        BodySchema extends Paramaters.NestedObject,
        QuerySchema extends Paramaters.FlatObject,
        HeaderSchema extends Paramaters.FlatObject,

        ParsedBodySchema extends Binder.ConvertObjectToType<BodySchema>,
        ParsedQuerySchema extends Binder.ConvertObjectToType<QuerySchema>,
        ParsedHeaderSchema extends Binder.ConvertHeaderObjectToType<HeaderSchema>,
        
        Request extends Binder.Request<{},
            ParsedBodySchema,
            ParsedQuerySchema,
            ParsedHeaderSchema,
            MiddlewareData
        >
    > = {
        handler: (
            request: Request
        ) => Promise<MiddlewareData | void> | MiddlewareData | void;
    };


    type AnyClass = Class<any, any, any, any, any, any, any, any>;
    


    /**
     * @name Configuration
     */
    type Configuration = {
        body_schema: Paramaters.Body;
        query_schema: Paramaters.Query;
        headers_schema: Paramaters.Headers;
        compilable_schemas: CompileSchema;
    };



    /** 
     * @name OptionalConfiguration
     * Same as Configuration, but all fields are optional
    */
    type OptionalConfiguration = Partial<Configuration>;


    type Dict = { [key: string]: AnyClass; }
    type Extract<T> = T extends 
        { [key: string]: { data: infer U } } ? 
        { [key in keyof T]: U } : never;
}