import {RouterTypes} from "./types";
import {FastifyRequest} from "fastify";
import ParserError from "./parser/parser_error";
import {validate_object} from "./parser/validate_object";

export default class Binder<
    Body extends RouterTypes.Binder.RequiredBody,
    Query extends RouterTypes.Binder.RequiredQuery,
    Headers extends RouterTypes.Binder.RequiredHeaders,
    Request extends RouterTypes.Binder.Request<
        RouterTypes.Binder.ConvertObjectToType<Body>,
        RouterTypes.Binder.ConvertObjectToType<Query>,
        RouterTypes.Binder.ConvertHeaderObjectToType<Headers>
    >
>{
    private readonly _method: RouterTypes.Method;
    private readonly _handler: (request: Request) => Promise<any> | any;
    private readonly _required_body: Body;
    private readonly _required_query: Query;
    private readonly _required_headers: Headers;



    public constructor(
        method: RouterTypes.Method,
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
        Request extends RouterTypes.Binder.Request<
            RouterTypes.Binder.ConvertObjectToType<Body>,
            RouterTypes.Binder.ConvertObjectToType<Query>,
            RouterTypes.Binder.ConvertHeaderObjectToType<Headers>
        >
    >(
        parameters: {
            method: RouterTypes.Method,
            handler: (request: Request) => Promise<any> | any,
            required_body?: Body,
            required_query?: Query,
            required_headers?: Headers
        }
    ): Binder<Body, Query, Headers, Request> => new Binder(
        parameters.method,
        parameters.handler,
        parameters.required_body || {} as Body,
        parameters.required_query || {} as Query,
        parameters.required_headers || {} as Headers
    );



    public async validate(
        fastify_request: FastifyRequest
    ): Promise<void | ParserError> {

        // -- TODO: Check the headers for a content-type and validate the body based on that
        //    If no content-type is found, return a ParserError
        //    If the content-type is not supported, return a ParserError

        // -- Validate Body
        const body = await validate_object(
            this._required_body,
            fastify_request.body as object
        ).catch((error) => error);
        if (body instanceof ParserError) return body;


        // -- Validate Headers
        const query = await validate_object(
            this._required_query,
            fastify_request.query as object
        ).catch((error) => error);
        if (query instanceof ParserError) return query;
    }




    public get method(): RouterTypes.Method { return this._method; }
    public get required_body(): Body { return this._required_body; }
    public get required_query(): Query { return this._required_query; }
    public get required_headers(): Headers { return this._required_headers; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
