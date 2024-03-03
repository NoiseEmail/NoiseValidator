import {FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';
import Log from '../logger/log';
import RouterError from '../router/error';
import Route from '../router/route';
import { Paramaters } from './types';
import { Binder as BinderType } from './types';
import { DynamicURL, Router } from '../router/types';
import CompileSchema from './schema';
import { mergician } from 'mergician';
import { Middleware } from '../middleware/types';



export default class Binder<
    MiddlewareDict extends Middleware.Dict,
    MiddlewareData extends Middleware.Extract<MiddlewareDict>,

    UrlPath extends string,

    BodySchema extends Paramaters.Body,
    QuerySchema extends Paramaters.Query,
    HeaderSchema extends Paramaters.Headers,

    ParsedBodySchema extends BinderType.ConvertObjectToType<BodySchema>,
    ParsedQuerySchema extends BinderType.ConvertObjectToType<QuerySchema>,
    ParsedHeaderSchema extends BinderType.ConvertHeaderObjectToType<HeaderSchema>,
    ParsedUrlPath extends DynamicURL.Extracted<UrlPath>,

    Request extends BinderType.Request<
        ParsedUrlPath,
        ParsedBodySchema,
        ParsedQuerySchema,
        ParsedHeaderSchema,
        MiddlewareData
    >
>{
    private readonly _id: String = Math.random().toString(36).substring(7);
    private readonly _method: HTTPMethods;
    private readonly _handler: Router.Executable<Request>;
    private readonly _compilable_schemas: CompileSchema;

    private readonly _middleware: MiddlewareDict;

    private readonly _body_schema: BodySchema;
    private readonly _query_schema: QuerySchema;
    private readonly _headers_schema: HeaderSchema;

    private _compiled_body_schemas: Array<Paramaters.Body> = [];
    private _compiled_query_schemas: Array<Paramaters.Query> = [];
    private _compiled_headers_schemas: Array<Paramaters.Headers> = [];



    public constructor(
        route: Route<UrlPath, Router.Configuration<UrlPath>>,
        configuration: BinderType.Configuration<
            MiddlewareDict,
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        >
    ) {
        this._method = configuration.method;
        this._handler = configuration.handler;
        this._body_schema = configuration.body_schema;
        this._query_schema = configuration.query_schema;
        this._headers_schema = configuration.headers_schema;
        this._compilable_schemas = configuration.compilable_schemas;
        this._middleware = configuration.middleware;
    
        route.bind(this);
    }



    public static new = <
        MiddlewareDict extends Middleware.Dict,
        MiddlewareData extends Middleware.Extract<MiddlewareDict>,

        UrlPath extends string,

        BodySchema extends Paramaters.Body,
        QuerySchema extends Paramaters.Query,
        HeaderSchema extends Paramaters.Headers,

        BodyParsed extends BinderType.ConvertObjectToType<BodySchema>,
        QueryParsed extends BinderType.ConvertObjectToType<QuerySchema>,
        HeadersParsed extends BinderType.ConvertHeaderObjectToType<HeaderSchema>,
        PathParsed extends DynamicURL.Extracted<UrlPath>,

        Request extends BinderType.Request<
            PathParsed,
            BodyParsed,
            QueryParsed,
            HeadersParsed,
            MiddlewareData
        >
    >(
        route: Route<UrlPath, Router.Configuration<UrlPath>>,
        parameters: BinderType.OptionalConfiguration<
            MiddlewareDict,
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        >
    ) => {

        // -- Merge the default configuration with the provided configuration
        const merged_configuration: BinderType.Configuration<
            MiddlewareDict,
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        > = mergician({})(Binder.DefaultConfiguration<
            MiddlewareDict,
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        >(), parameters);

        
        // -- Create a new binder instance
        return new Binder(route, merged_configuration);
    }



    public compile = (): void => {

        // -- Tempp arrays to store the schemas before they are compiled
        const temp_schemas = {
            body: [ this._compilable_schemas.body ? this._body_schema : {} ],
            query: [ this._compilable_schemas.query ? this._query_schema : {} ],
            headers: [ this._compilable_schemas.headers ? this._headers_schema : {} ]
        };

        // -- Add the scheams that cant be compiled to the compiled schemas
        if (!this._compilable_schemas.body) this._compiled_body_schemas.push(this._body_schema);
        if (!this._compilable_schemas.query) this._compiled_query_schemas.push(this._query_schema);
        if (!this._compilable_schemas.headers) this._compiled_headers_schemas.push(this._headers_schema);



    };



    private _get_all_middleware_schemas = (): {
        body: Array<Paramaters.Body>,
        query: Array<Paramaters.Query>,
        headers: Array<Paramaters.Headers>
    } => {
        
        const middleware_schemas = {
            body: [],
            query: [],
            headers: []
        };

        return middleware_schemas;
    }




    public static DefaultConfiguration = <
        MiddlewareDict extends Middleware.Dict,
        BodySchema extends Paramaters.Body,
        QuerySchema extends Paramaters.Query,
        HeaderSchema extends Paramaters.Headers,
        Request extends BinderType.Request<
            DynamicURL.Extracted<string>,
            BinderType.ConvertObjectToType<BodySchema>,
            BinderType.ConvertObjectToType<QuerySchema>,
            BinderType.ConvertHeaderObjectToType<HeaderSchema>,
            Middleware.Extract<MiddlewareDict>
        >
    >() => {
        return {
            method: 'GET',
            handler: async(request: Request) => Binder.respond(500, 'No handler was provided'),

            body_schema: {} as BodySchema,
            query_schema: {} as QuerySchema,
            headers_schema: {} as HeaderSchema,
            middleware: {} as MiddlewareDict,

            compilable_schemas: CompileSchema.All()
        }
    }



    public process = async(
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply,

        body: ParsedBodySchema,
        query: ParsedQuerySchema,
        headers: ParsedHeaderSchema
    ): Promise<Router.ExecutableReturnable> => {

        // @ts-ignore
        const request_body: Request = {
            body: body,
            query: query,
            headers: headers,
            dynamic_url: fastify_request.params,

            fastify: {
                request: fastify_request,
                reply: fastify_reply
            },

            set_header: (key: string, value: string): void => 
                Binder._set_header(fastify_reply, key, value),
            set_headers: ([key, value]: [string, string]): void => 
                Binder._set_headers(fastify_reply, [key, value]),
            remove_header: (key: string): void => 
                Binder._remove_header(fastify_reply, key),
            remove_headers: (keys: Array<string>): void =>
                Binder._remove_headers(fastify_reply, keys),
        };

        return this._handler(request_body);
    }


    public static respond = (
        response_code: Router.StatusBuilder.Status | number,
        response_body?: any,
        content_type?: string
    ): Router.ReturnableObject => {
        return {
            status: response_code,
            body: response_body || {},
            content_type: content_type
        }
    }

    public static error = (
        response_code: Router.StatusBuilder.Status | number,
        message: String,
        data?: any
    ): RouterError => new RouterError(response_code, message, data);



    public static response_code = (
        response_code: Router.StatusBuilder.Status | number
    ): number => {
        if (typeof response_code === 'string') return Number(response_code.split('_')[0]);
        return response_code;
    }

    private static _set_header = (
        fastify_reply: FastifyReply,
        key: string,
        value: string
    ): void => {
        if (fastify_reply.sent) Log.warn('Response was already sent, server will not respond in expected manner');
        else fastify_reply.header(key, value);
    }

    private static _remove_header = (
        fastify_reply: FastifyReply,
        key: string
    ): void => {
        if (fastify_reply.sent) Log.warn('Response was already sent, server will not respond in expected manner');
        else fastify_reply.removeHeader(key);
    }

    private static _remove_headers = (
        fastify_reply: FastifyReply,
        keys: Array<string>
    ): void => {
        if (fastify_reply.sent) Log.warn('Response was already sent, server will not respond in expected manner');
        else for (const key of keys) fastify_reply.removeHeader(key);
    }

    private static _set_headers = (
        fastify_reply: FastifyReply,
        [key, value]: [string, string]
    ): void => {
        if (fastify_reply.sent) Log.warn('Response was already sent, server will not respond in expected manner');
        else fastify_reply.header(key, value);
    }



    public get id(): String { return this._id; }
    public get method(): HTTPMethods { return this._method; }
    public get body_schema(): BodySchema { return this._body_schema; }
    public get query_schema(): QuerySchema { return this._query_schema; }
    public get headers_schema(): HeaderSchema { return this._headers_schema; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
