import { Binder, Paramaters } from '../binder/types';
import CompileSchema from '../binder/schema';
import { Middleware } from './types';
import { mergician } from 'mergician';



export default class GenericMiddleware<
    DataShape extends any,

    Body extends Paramaters.Body,
    Query extends Paramaters.Query,
    Headers extends Paramaters.Headers,

    ParsedBody extends Binder.ConvertObjectToType<Body>,
    ParsedQuery extends Binder.ConvertObjectToType<Query>,
    ParsedHeaders extends Binder.ConvertHeaderObjectToType<Headers>,

    Request extends Binder.Request<{},
        ParsedBody,
        ParsedQuery,
        ParsedHeaders
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
    public static Builder = <DataShape = void> (
        configuration: Middleware.OptionalConfiguration = GenericMiddleware.DefaultConfiguration
    ) => {

        const merged_configuration: Middleware.Configuration = mergician({})(
            GenericMiddleware.DefaultConfiguration, 
            configuration
        );


        return class extends GenericMiddleware<
            DataShape,
            Paramaters.Body,
            Paramaters.Query,
            Paramaters.Headers,

            Binder.ConvertObjectToType<Paramaters.Body>,
            Binder.ConvertObjectToType<Paramaters.Query>,
            Binder.ConvertHeaderObjectToType<Paramaters.Headers>,
            
            Binder.Request<{},
                Binder.ConvertObjectToType<Paramaters.Body>,
                Binder.ConvertObjectToType<Paramaters.Query>,
                Binder.ConvertHeaderObjectToType<Paramaters.Headers>
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

    protected continue = ( data: DataShape ) => {};
    protected exit = () => {};

    protected get request(): Request { return this._request as Request; }
    protected get parsed_body(): ParsedBody { return this.request.body as ParsedBody; }
    public _set_request(request: Request) { this._request = request; }
    public get id(): String { return this._id; }
}