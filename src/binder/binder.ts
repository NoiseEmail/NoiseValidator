import {FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';
import Log, { info } from '../logger/log';
import RouterError from '../router/error';
import Route from '../router/route';
import { Paramaters } from './types';
import { Binder as BinderType } from './types';
import { DynamicURL, Router } from '../router/types';
import { mergician } from 'mergician';
import { Middleware } from '../middleware/types';
import ParserError from '../parser/error';
import { wrapper } from '../parser/validate/wrapper';
import { merge_nested_schemas } from '../parser/merge';
import log from '../logger/log';



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

    private readonly _middleware: MiddlewareDict;

    private readonly _body_schema: BodySchema;
    private readonly _query_schema: QuerySchema;
    private readonly _header_schema: HeaderSchema;

    private _compiled_body_schemas: Paramaters.WrappedBody = {};
    private _compiled_query_schemas: Paramaters.WrappedQuery = {};
    private _compiled_header_schemas: Paramaters.Headers = {};


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
        this._header_schema = configuration.header_schema;
        this._middleware = configuration.middleware;
    
        route.bind(this);

        // -- Compile the schemas
        this.compile();
        console.log(this._compiled_body_schemas);
        console.log(this._compiled_query_schemas);
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
        const schemas: Paramaters.SchemaDict = mergician({
            appendArrays: true,
        })(
            this._get_middleware_schemas(), 
            this._get_binder_schemas()
        );


        // -- Set the compiled schemas
        const merged_body_schemas = merge_nested_schemas(schemas.body);
        if (merged_body_schemas instanceof ParserError) {
            Log.error('Failed to compile body schemas:', merged_body_schemas);
            throw merged_body_schemas;
        }

        const merged_query_schemas = merge_nested_schemas(schemas.query);
        if (merged_query_schemas instanceof ParserError) {
            Log.error('Failed to compile query schemas:', merged_query_schemas);
            throw merged_query_schemas;
        }

        this._compiled_body_schemas = merged_body_schemas;
        this._compiled_query_schemas = merged_query_schemas;
        // this._compiled_header_schemas = schemas.headers;
    };



    private _get_middleware_schemas = (): Paramaters.SchemaDict => {
        
        const middleware_schemas: Paramaters.SchemaDict = {
            body: [], query: [], headers: [] };

        
        // -- Loop through all the middleware and add the 
        //    schemas to the temp_schemas if they are compilable
        for (const middleware_key in this._middleware) {
            const middleware = this._middleware[middleware_key];
            middleware_schemas.body.push(
                wrapper(middleware.configuration.body_schema, middleware.id));
            middleware_schemas.query.push(
                wrapper(middleware.configuration.query_schema, middleware.id));
            middleware_schemas.headers.push(
                middleware.configuration.header_schema);
        }


        return middleware_schemas;
    }
    



    private _get_binder_schemas = (): Paramaters.SchemaDict => {
        return {
            body: [wrapper(this._body_schema, this.id)],
            query: [wrapper(this._query_schema, this.id)],
            headers: [this._header_schema]
        };
    };



    public validate = (
        request: FastifyRequest
    ): Promise<ParserError | void> => new Promise((resolve) => {

    });



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
            header_schema: {} as HeaderSchema,
            middleware: {} as MiddlewareDict,
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
    public get header_schema(): HeaderSchema { return this._header_schema; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
