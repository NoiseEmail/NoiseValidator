import {RouterTypes} from "./types";

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


    public get method(): RouterTypes.Method { return this._method; }
    public get required_body(): Body { return this._required_body; }
    public get required_query(): Query { return this._required_query; }
    public get required_headers(): Headers { return this._required_headers; }
    public get handler(): (request: Request) => Promise<any> | any { return this._handler; }
}
