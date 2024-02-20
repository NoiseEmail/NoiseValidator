import {RouterTypes} from "./types";
import {FastifyReply, FastifyRequest, HTTPMethods} from "fastify";
import {object} from "../parser/object";
import Log from "../logger/log";
import {headers} from "../parser/headers";
import ParserError from "../parser/error";
import RouterError from "./error";

export default class Binder<
    Body extends RouterTypes.Binder.RequiredBody,
    Query extends RouterTypes.Binder.RequiredQuery,
    Headers extends RouterTypes.Binder.RequiredHeaders,

    ParsedBody extends RouterTypes.Binder.ConvertObjectToType<Body>,
    ParsedQuery extends RouterTypes.Binder.ConvertObjectToType<Query>,
    ParsedHeaders extends RouterTypes.Binder.ConvertHeaderObjectToType<Headers>,

    Request extends RouterTypes.Binder.Request<
        RouterTypes.Binder.ConvertObjectToType<Body>,
        RouterTypes.Binder.ConvertObjectToType<Query>,
        RouterTypes.Binder.ConvertHeaderObjectToType<Headers>
    >
>{
    private readonly _method: HTTPMethods;
    private readonly _handler: RouterTypes.Router.Executable<Request> = async() => {};
    private readonly _required_body: Body;
    private readonly _required_query: Query;
    private readonly _required_headers: Headers;



    public constructor(
        method: HTTPMethods,
        handler: (request: Request) => Promise<any> | any,
        required_body: Body,
        required_query: Query,
        required_headers: Headers
    ) {
        this._method = method;
        this._required_body = required_body;
        this._required_query = required_query;
        this._required_headers = required_headers;
        this._handler = handler;
    }



    public static new = <
        Body extends RouterTypes.Binder.RequiredBody,
        Query extends RouterTypes.Binder.RequiredQuery,
        Headers extends RouterTypes.Binder.RequiredHeaders,

        BodyParsed extends RouterTypes.Binder.ConvertObjectToType<Body>,
        QueryParsed extends RouterTypes.Binder.ConvertObjectToType<Query>,
        HeadersParsed extends RouterTypes.Binder.ConvertHeaderObjectToType<Headers>,

        Request extends RouterTypes.Binder.Request<
            RouterTypes.Binder.ConvertObjectToType<Body>,
            RouterTypes.Binder.ConvertObjectToType<Query>,
            RouterTypes.Binder.ConvertHeaderObjectToType<Headers>
        >
    >(
        parameters: {
            method: HTTPMethods,
            handler: RouterTypes.Router.Executable<Request>,
            required_body?: Body,
            required_query?: Query,
            required_headers?: Headers
        }
    ): Binder<Body, Query, Headers, BodyParsed, QueryParsed, HeadersParsed, Request> => new Binder(
        parameters.method,
        parameters.handler,
        parameters.required_body || {} as Body,
        parameters.required_query || {} as Query,
        parameters.required_headers || {} as Headers
    );



    public async validate(
        fastify_request: FastifyRequest
    ): Promise<ParserError | {
        body: ParsedBody,
        query: ParsedQuery,
        headers: ParsedHeaders,
        binder: Binder<Body, Query, Headers, ParsedBody, ParsedQuery, ParsedHeaders, Request>
    }> {

        // -- TODO: Check the headers for a content-type and validate the body based on that
        //    If no content-type is found, return a ParserError
        //    If the content-type is not supported, return a ParserError

        // -- Validate Body
        const body = await object(
            this._required_body,
            fastify_request.body as object
        ).catch((error) => error);
        if (body instanceof ParserError) return body;


        // -- Validate Headers
        const query = await object(
            this._required_query,
            fastify_request.query as object
        ).catch((error) => error);
        if (query instanceof ParserError) return query;


        // -- Validate Headers
        const headers_error = headers(fastify_request.headers, this._required_headers);
        if (headers_error) return headers_error;


        return {
            body: body as ParsedBody,
            query: query as ParsedQuery,
            headers: {} as ParsedHeaders,
            binder: this
        }
    }



    public process = async(
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply,
        body: ParsedBody,
        query: ParsedQuery,
        headers: ParsedHeaders
    ): Promise<RouterTypes.Router.ExecutableReturnable> => {
        // @ts-ignore
        return this._handler({
            body: body,
            query: query,
            headers: headers,
            fastify: {
                request: fastify_request,
                reply: fastify_reply
            },

            set_header: (key: string, value: string) => Binder._set_header(fastify_reply, key, value),
            set_headers: (headers: [string, string][]) => Binder._set_headers(fastify_reply, headers),
            remove_header: (key: string) => Binder._remove_header(fastify_reply, key),
            remove_headers: (keys: Array<string>) => Binder._remove_headers(fastify_reply, keys),
        });
    }


    public static respond = (
        response_code: RouterTypes.Router.StatusBuilder.Status | number,
        response_body?: any,
        content_type?: string
    ): RouterTypes.Router.ReturnableObject => {
        return {
            status: response_code,
            body: response_body || {},
            content_type: content_type
        }
    }

    public static error = (
        response_code: RouterTypes.Router.StatusBuilder.Status | number,
        message: String,
        data?: any
    ): RouterError => new RouterError(response_code, message, data);



    public static response_code = (
        response_code: RouterTypes.Router.StatusBuilder.Status | number
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
        headers: [string, string][]
    ): void => {
        if (fastify_reply.sent) Log.warn('Response was already sent, server will not respond in expected manner');
        else for (const [key, value] of Object.entries(headers)) fastify_reply.header(key, value);
    }



    public get method(): HTTPMethods { return this._method; }
    public get required_body(): Body { return this._required_body; }
    public get required_query(): Query { return this._required_query; }
    public get required_headers(): Headers { return this._required_headers; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
