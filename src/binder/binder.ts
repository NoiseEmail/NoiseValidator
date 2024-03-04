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
import { wrapper } from '../schema/wrapper';
import { merge_nested_schemas } from '../schema/merge/nested_object';
import log from '../logger/log';
import { merge_header_schemas } from '../schema/merge/headers';
import { parse_object } from '../parser/object';
import { parse_headers } from '../parser/headers';
import GenericMiddleware from '../middleware/middleware';



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
    private readonly _id: string = Math.random().toString(36).substring(5);
    private readonly _method: HTTPMethods;
    private readonly _handler: Router.Executable<Request>;

    private readonly _middleware: MiddlewareDict;
    private readonly _middleware_map: Map<string, {
        middleware: Middleware.Class<any, any, any, any, any, any, any, any>,
        key: string
    }> = new Map();

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
        this._map_middleware();
        this.compile();
    }



    private _map_middleware = (): void => {
        for (const middleware_key in this._middleware) {
            const middleware = this._middleware[middleware_key];
            this._middleware_map.set(middleware.id, {
                middleware: middleware,
                key: middleware_key
            });
        }
    };



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
        if (merged_body_schemas instanceof Error) {
            Log.error('Failed to compile body schemas:', merged_body_schemas);
            throw merged_body_schemas;
        }

        const merged_query_schemas = merge_nested_schemas(schemas.query);
        if (merged_query_schemas instanceof Error) {
            Log.error('Failed to compile query schemas:', merged_query_schemas);
            throw merged_query_schemas;
        }
        
        this._compiled_body_schemas = merged_body_schemas;
        this._compiled_query_schemas = merged_query_schemas;
        this._compiled_header_schemas = merge_header_schemas(schemas.headers);
    };



    private _get_middleware_schemas = (): Paramaters.SchemaDict => {
        
        const middleware_schemas: Paramaters.SchemaDict = {
            body: [], query: [], headers: [] };

        
        // -- Loop through all the middleware and add the 
        //    schemas to the temp_schemas if they are compilable
        for (const middleware_key in this._middleware) {
            const middleware = this._middleware[middleware_key];
            middleware_schemas.body.push(
                wrapper(middleware.configuration.body_schema, middleware.id, 'Middleware'));
            middleware_schemas.query.push(
                wrapper(middleware.configuration.query_schema, middleware.id, 'Middleware'));
            middleware_schemas.headers.push(
                middleware.configuration.header_schema);
        }


        return middleware_schemas;
    }
    



    private _get_binder_schemas = (): Paramaters.SchemaDict => {
        return {
            body: [wrapper(this._body_schema, this.id, 'Binder')],
            query: [wrapper(this._query_schema, this.id, 'Binder')],
            headers: [this._header_schema]
        };
    };



    public validate = async (
        request: FastifyRequest
    ): Promise<ParserError | Router.RouteCompatibleObject> => {

        
        // -- Get the body, query, headers and dynamic url
        const body = request.body as object,
            query = request.query as object,
            headers = request.headers as object,
            url = request.params as DynamicURL.Extracted<string>;

        
        // -- Validate the body, query and headers
        const body_result = await parse_object(this._compiled_body_schemas, body);
        const query_result = await parse_object(this._compiled_query_schemas, query);

        if (body_result instanceof ParserError) return body_result;
        if (query_result instanceof ParserError) return query_result;

        const header_result = parse_headers(this._compiled_header_schemas, headers);
        if (header_result instanceof ParserError) return header_result;


        // -- Return the validated request
        return {
            binder: this as BinderType.Any,
            body: body_result,
            query: query_result,
            headers: headers as ParsedHeaderSchema,
            url: url as ParsedUrlPath,
            middleware: {}
        }
    };



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
        headers: ParsedHeaderSchema,
        middleware: MiddlewareData,

        url: ParsedUrlPath
    ): Promise<Router.ExecutableReturnable> => {

        // @ts-ignore
        const request_body: Request = {
            url,
            body: body,
            query: query,
            headers: headers,
            dynamic_url: fastify_request.params,
            middleware: middleware,
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
    };



    private _modfiy_request = (
        id: string,
        route_object: Paramaters.ObjectParaseResult<
            Paramaters.Body | 
            Paramaters.Query
        >,
    ): BinderType.ConvertObjectToType<any> | RouterError => {

        const modifiers = route_object.custom_validators.get(id);
        if (!modifiers) return route_object;
        let parsed_object = route_object.parsed_object;

        for (const modifier of modifiers) {
            
            const steps = modifier.path,
                new_value = modifier.value;

            // -- Walk parsed_object to the correct location
            //    and then set the new value stop right before the last step
            let current = parsed_object;
            for (const step of steps.slice(0, -1)) {
                current = current[step];
            };

            // @ts-ignore
            current = new_value;
            
        }

        return parsed_object;
    }



    public validate_middleware = async (
        id: string,
        route_object: Router.RouteCompatibleObject,
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply
    ): Promise<unknown | RouterError> => {
        

        // -- Attempt to find the middleware
        const middleware = this._middleware_map.get(id);
        if (!middleware) return Binder.error(500, 'Middleware object not found');


        // -- Modify the Body and Query results to include the middleware
        //    specific data
        const body = this._modfiy_request(id, route_object.body);
        if (body instanceof RouterError) return body;

        const query = this._modfiy_request(id, route_object.query);
        if (query instanceof RouterError) return query;
        
       
        return await GenericMiddleware.execute({
            body: body,
            query: query,
            headers: route_object.headers,
            url: route_object.url,
            middleware: {},

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
        }, middleware.middleware);
    };



    public validate_all_middleware = async (
        route_object: Router.RouteCompatibleObject,
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply
    ) => {

        const ids = this._middleware_map.keys(),
            returnable: {[id: string]: unknown} = {};


        for (const id of ids) {
            const key = this._middleware_map.get(id)?.key;
            if (!key) return Binder.error(500, 'Middleware key not found');

            const result = await this.validate_middleware(id, 
                route_object, 
                fastify_request,
                fastify_reply
            );

            if (result instanceof RouterError) return result;
            returnable[key] = result;
        };

        return returnable;
    };



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



    public get id(): string { return this._id; }
    public get method(): HTTPMethods { return this._method; }
    public get body_schema(): BodySchema { return this._body_schema; }
    public get query_schema(): QuerySchema { return this._query_schema; }
    public get header_schema(): HeaderSchema { return this._header_schema; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
