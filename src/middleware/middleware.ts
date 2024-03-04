import { Binder, Paramaters } from '../binder/types';
import { Middleware } from './types';
import { mergician } from 'mergician';
import { error } from '../logger/log';
import RouterError from '../router/error';



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
        const merged_configuration: Middleware.Configuration<
            BodySchema, 
            QuerySchema, 
            HeaderSchema
        > = mergician({})(
            GenericMiddleware.DefaultConfiguration(), 
            configuration
        );

        this._configuration = merged_configuration;
        this._body_schema = merged_configuration.body_schema
        this._query_schema = merged_configuration.query_schema;
        this._header_schema = merged_configuration.header_schema;
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
        configuration: Middleware.Configuration<
            BodySchema, 
            QuerySchema, 
            HeadersSchema
        >
    ) => {
        const id = Math.random().toString(36).substring(7);
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
                    super(configuration, request, id);
                }
                
                public static New = (
                    request: Binder.Request<{},
                        Binder.ConvertObjectToType<BodySchema>,
                        Binder.ConvertObjectToType<QuerySchema>,
                        Binder.ConvertHeaderObjectToType<HeadersSchema>,
                        MiddlewareData
                    >
                ) => {
                    return new Extended(request);
                }


                private _handler: Middleware.Function<
                    MiddlewareData,
                    {},
                    BodySchema,
                    QuerySchema,
                    HeadersSchema
                > = async (request, next, stop) => {};
                


                /**
                 * @name entrypoint
                 * This setter is used to define where the 
                 * entrypoint of the middleware is, this
                 * will be the function that is called when
                 * the middleware is executed.
                 */
                protected set entrypoint(handler: Middleware.Function<
                    MiddlewareData,
                    {},
                    BodySchema,
                    QuerySchema,
                    HeadersSchema
                >) {
                    this._handler = handler;
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
                    Middleware.Configuration<BodySchema, QuerySchema, HeadersSchema> = configuration;
            
                public static readonly id: string = id;
            };

            
    
            return returnable;
        }
    };



    public get body_schema(): Paramaters.Body { return this._body_schema; }
    public get query_schema(): Paramaters.Query { return this._query_schema; }
    public get header_schema(): Paramaters.Headers { return this._header_schema; }
    public get configuration(): Middleware.Configuration { return this._configuration; }

    public get body(): ParsedBodySchema { return this._request.body as ParsedBodySchema; }
    public get query(): ParsedQuerySchema { return this._request.query as ParsedQuerySchema; }
    public get headers(): ParsedHeaderSchema { return this._request.headers as ParsedHeaderSchema; }
}