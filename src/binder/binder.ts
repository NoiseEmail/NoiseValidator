import {FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';
import Log from '../logger/log';
import RouterError from '../router/error';
import Route from '../router/route';
import { Paramaters } from './types';
import { Binder as BinderType } from './types';
import { DynamicURL, Router } from '../router/types';
import CompileSchema from './schema';
import { mergician } from 'mergician';



export default class Binder<
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
        ParsedHeaderSchema
    >
>{
    private readonly _id: String = Math.random().toString(36).substring(7);
    private readonly _method: HTTPMethods;
    private readonly _handler: Router.Executable<Request>;

    private readonly _body_schema: BodySchema;
    private readonly _query_schema: QuerySchema;
    private readonly _headers_schema: HeaderSchema;

    private _compiled_body_schema: Array<Paramaters.Body> = [];
    private _compiled_query_schema: Array<Paramaters.Query> = [];
    private _compiled_headers_schema: Array<Paramaters.Headers> = [];

    

    public constructor(
        route: Route<UrlPath, Router.Configuration<UrlPath>>,
        method: HTTPMethods,
        handler: (request: Request) => Promise<any> | any,
        body_schema: BodySchema,
        query_schema: QuerySchema,
        headers_schema: HeaderSchema
    ) {
        this._method = method;
        this._body_schema = body_schema;
        this._query_schema = query_schema;
        this._headers_schema = headers_schema;
        this._handler = handler;

        route.bind(this);
    }



    public static new = <
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
            HeadersParsed
        >
    >(
        route: Route<UrlPath, Router.Configuration<UrlPath>>,
        parameters: BinderType.OptionalConfiguration<
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        >
    ) => {


        const merged_configuration: BinderType.Configuration<
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        > = mergician({})(Binder.DefaultConfiguration<
            BodySchema, 
            QuerySchema, 
            HeaderSchema, 
            Request
        >(), parameters);


        return new Binder(route,
            merged_configuration.method,
            merged_configuration.handler,
            merged_configuration.body_schema,
            merged_configuration.query_schema,
            merged_configuration.headers_schema
        );
    }





    public static DefaultConfiguration = <
        BodySchema extends Paramaters.Body,
        QuerySchema extends Paramaters.Query,
        HeaderSchema extends Paramaters.Headers,
        Request extends BinderType.Request<
            DynamicURL.Extracted<string>,
            BinderType.ConvertObjectToType<BodySchema>,
            BinderType.ConvertObjectToType<QuerySchema>,
            BinderType.ConvertHeaderObjectToType<HeaderSchema>
        >
    >() => {
        return {
            method: 'GET',
            handler: async(request: Request) => Binder.respond(500, 'No handler was provided'),

            body_schema: {} as BodySchema,
            query_schema: {} as QuerySchema,
            headers_schema: {} as HeaderSchema,

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
