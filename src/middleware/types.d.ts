import { Binder, Paramaters } from '../binder/types';
import RouterError from '../router/error';

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

        BodySchema extends Paramaters.Body,
        QuerySchema extends Paramaters.Query,
        HeaderSchema extends Paramaters.Headers,

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
        readonly _data_type_do_not_call: MiddlewareData;
    };


    type AnyClass = Class<any, any, any, any, any, any, any, any> & { 
        _data_type_do_not_call: any; 
        configuration: Configuration;
        id: string;
    };
    


    /**
     * @name Configuration
     */
    type Configuration<
        BodySchema extends Paramaters.NestedObject = {},
        QuerySchema extends Paramaters.FlatObject = {},
        HeadersSchema extends Paramaters.FlatObject = {},
    > = {
        body_schema: BodySchema;
        query_schema: QuerySchema;
        header_schema: HeadersSchema;
    };



    /** 
     * @name OptionalConfiguration
     * Same as Configuration, but all fields are optional
    */
    type OptionalConfiguration<
        BodySchema extends Paramaters.NestedObject = {},
        QuerySchema extends Paramaters.FlatObject = {},
        HeadersSchema extends Paramaters.FlatObject = {},
    > = Partial<Configuration<BodySchema, QuerySchema, HeadersSchema>>;


    type Dict = { [key: string]: AnyClass; }




    type InferFromConfiguration<
        Configuration extends Middleware.Configuration,
        Key extends keyof Configuration
    > = Configuration[Key];


    type InferDataType<Value> = Value extends { _data_type_do_not_call: infer U } ? U : never;
    
    type BuildObject<T extends Dict> = { [K in keyof T]: T[K]['_data_type_do_not_call'] };
    type Extract<MiddlewareDict extends Dict> = BuildObject<MiddlewareDict>;
}