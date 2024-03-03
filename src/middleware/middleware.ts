import { Binder, Paramaters } from '../binder/types';
import CompileSchema from '../binder/schema';
import { Middleware } from './types';
import { mergician } from 'mergician';



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
    private readonly _id: String = Math.random().toString(36).substring(7);
    private _request: Request | null = null;

    

    /**
     * @name Builder
     * 
     * Returns a fully typed builder for the generic middleware.
     * 
     * @returns {GenericMiddleware} - Returns a fully typed builder for the generic middleware.
     */
    public static Builder = <MiddlewareData = void> (
        configuration: Middleware.OptionalConfiguration = GenericMiddleware.DefaultConfiguration
    ) => {

        const merged_configuration: Middleware.Configuration = mergician({})(
            GenericMiddleware.DefaultConfiguration, 
            configuration
        );


        return class extends GenericMiddleware<
            MiddlewareData,

            Paramaters.Body,
            Paramaters.Query,
            Paramaters.Headers,

            Binder.ConvertObjectToType<Paramaters.Body>,
            Binder.ConvertObjectToType<Paramaters.Query>,
            Binder.ConvertHeaderObjectToType<Paramaters.Headers>,
            
            Binder.Request<{},
                Binder.ConvertObjectToType<Paramaters.Body>,
                Binder.ConvertObjectToType<Paramaters.Query>,
                Binder.ConvertHeaderObjectToType<Paramaters.Headers>,
                MiddlewareData
            >
        > { 
            constructor() { super() } 

            protected readonly _configuration = merged_configuration;
            protected readonly _compilable_schemas = merged_configuration.compilable_schemas;
            protected readonly _body_schema = merged_configuration.body_schema ;
            protected readonly _query_schema = merged_configuration.query_schema;
            protected readonly _headers_schema = merged_configuration.headers_schema;

            public get body_schema(): Paramaters.Body { return this._body_schema; }
            public get query_schema(): Paramaters.Query { return this._query_schema; }
            public get headers_schema(): Paramaters.Headers { return this._headers_schema; }
            public get compilable_schemas(): CompileSchema { return this._compilable_schemas; }
        };
    };



    public static readonly DefaultConfiguration: Middleware.Configuration = {
        body_schema: {},
        query_schema: {},
        headers_schema: {}, 
        compilable_schemas: CompileSchema.All()
    };

    protected continue = ( data: MiddlewareData ) => {};
    protected exit = () => {};

    protected get request(): Request { return this._request as Request; }
    public _set_request(request: Request) { this._request = request; }
    public get id(): String { return this._id; }
    public get data(): MiddlewareData { return {} as MiddlewareData; }


    protected get headers(): ParsedHeaderSchema { return this._request?.headers as ParsedHeaderSchema; }
    protected get body(): ParsedBodySchema { return this._request?.body as ParsedBodySchema; }
    protected get query(): ParsedQuerySchema { return this._request?.query as ParsedQuerySchema; }
}