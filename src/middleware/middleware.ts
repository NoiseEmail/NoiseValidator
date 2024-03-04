import { Binder, Paramaters } from '../binder/types';
import { Middleware } from './types';
import { mergician } from 'mergician';
import log, { error, info } from '../logger/log';
import RouterError from '../router/error';
import { Router } from '../router/types';



export default class GenericMiddleware<
    MiddlewareData extends any,

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
> {
    private readonly _id: string;
    private readonly _request: Request;

    private readonly _configuration: Middleware.Configuration;
    private readonly _body_schema: BodySchema;
    private readonly _query_schema: QuerySchema;
    private readonly _header_schema: HeaderSchema;



    constructor(
        configuration: Middleware.Configuration<
            BodySchema, 
            QuerySchema, 
            HeaderSchema
        >,
        request: Request,
        id: string
    ) { 
        

        this._configuration = configuration;
        this._body_schema = configuration.body_schema
        this._query_schema = configuration.query_schema;
        this._header_schema = configuration.header_schema;
        this._request = request;
        this._id = id;
    } 



    protected continue = (data: MiddlewareData) => {};
    protected exit = (error: RouterError) => {};



    public static DefaultConfiguration = <
        BodySchema extends Paramaters.Body = {},
        QuerySchema extends Paramaters.Query = {},
        HeadersSchema extends Paramaters.Headers = {}
    >(): Middleware.Configuration<BodySchema, QuerySchema, HeadersSchema> => {
        return {
            body_schema: {} as BodySchema,
            query_schema: {} as QuerySchema,
            header_schema: {} as HeadersSchema,
        };
    };



    public static Builder = <
        BodySchema extends Paramaters.Body,
        QuerySchema extends Paramaters.Query,
        HeadersSchema extends Paramaters.Headers
    >(
        configuration: Middleware.OptionalConfiguration<
            BodySchema, 
            QuerySchema, 
            HeadersSchema
        >
    ) => {
        const id = Math.random().toString(36).substring(7);
        const merged_configuration: Middleware.Configuration<
            BodySchema, 
            QuerySchema, 
            HeadersSchema
        > = mergician({})(
            GenericMiddleware.DefaultConfiguration(), 
            configuration
        );

        return <MiddlewareData extends any = void>() => {
            const returnable = class Extended extends GenericMiddleware<
                MiddlewareData,
                BodySchema,
                QuerySchema,
                HeadersSchema,
                Binder.ConvertObjectToType<BodySchema>,
                Binder.ConvertObjectToType<QuerySchema>,
                Binder.ConvertHeaderObjectToType<HeadersSchema>,
                Binder.Request<{},
                    Binder.ConvertObjectToType<BodySchema>,
                    Binder.ConvertObjectToType<QuerySchema>,
                    Binder.ConvertHeaderObjectToType<HeadersSchema>,
                    MiddlewareData
                >
            > {
                protected constructor(
                    request: Binder.Request<{},
                        Binder.ConvertObjectToType<BodySchema>,
                        Binder.ConvertObjectToType<QuerySchema>,
                        Binder.ConvertHeaderObjectToType<HeadersSchema>,
                        MiddlewareData
                    >
                ) {    
                    
                    super(merged_configuration, request, id);
                }
            


                /**
                 * @name _data_type_do_not_call
                 * ----- DO NOT CALL THIS PROPERTY -----
                 * This property only exists to provide
                 * a way to infer the data type of the
                 * middleware.
                 * ----- DO NOT CALL THIS PROPERTY -----
                 */
                public static readonly _data_type_do_not_call: 
                    MiddlewareData = {} as MiddlewareData;

                public static readonly configuration:
                    Middleware.Configuration<BodySchema, QuerySchema, HeadersSchema> = merged_configuration;
            
                public static readonly id: string = id;
            };

            
    
            return returnable;
        }
    };



    public static execute = async (
        data: Binder.Request<any, any, any, any, any>,
        middleware_class: any
    ): Promise<RouterError | unknown> => {

        const middleware = new middleware_class(data);        
        const entrypoint = middleware.handler;
        if (entrypoint === undefined || !entrypoint) return new RouterError(
            '500_NOT_IMPLEMENTED', 
            'The handler is not implemented'
        );

        try { return await entrypoint(); } 
        catch (error) { return error; }
    };





    public get body_schema(): Paramaters.Body { return this._body_schema; }
    public get query_schema(): Paramaters.Query { return this._query_schema; }
    public get header_schema(): Paramaters.Headers { return this._header_schema; }
    public get configuration(): Middleware.Configuration { return this._configuration; }

    public get body(): ParsedBodySchema { return this._request.body as ParsedBodySchema; }
    public get query(): ParsedQuerySchema { return this._request.query as ParsedQuerySchema; }
    public get headers(): ParsedHeaderSchema { return this._request.headers as ParsedHeaderSchema; }
}