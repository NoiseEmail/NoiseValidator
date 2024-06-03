import { BinderNamespace } from 'noise_validator/src/binder/types';
import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify';
import { Log } from '..';
import { OptionalRouteConfiguration, RouteConfiguration } from './types.d';
import { RouteHandlerExecutedError } from './errors';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { v4 } from 'uuid';
import { GenericMiddleware } from 'noise_validator/src/middleware';
import { Server } from 'noise_validator/src/server';
import RequestProcessor from './request';



export default class Route<
    UrlPath extends string,
    ServerMiddleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject,
    RouteMiddleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject,
    AfterMiddleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject
> {
    public readonly _raw_path: UrlPath;
    public readonly _path: string;
    public readonly _id: string = v4();

    private _friendly_name: string | undefined;
    private _raw_binder_map: BinderNamespace.Binders = new Map();
    private _binder_map: BinderNamespace.Binders = new Map();

    private _server: Server<ServerMiddleware>;
    private _configuration: RouteConfiguration<ServerMiddleware, AfterMiddleware>;

    private _before_middleware: MiddlewareNamespace.MiddlewareObject = {};
    private _after_middleware: MiddlewareNamespace.MiddlewareObject = {};

    private readonly _no_method_error: BinderNamespace.MapObject;

    public constructor(
        server: Server<ServerMiddleware>,
        path: UrlPath,
        configuration?: OptionalRouteConfiguration<RouteMiddleware>
    ) {
        this._server = server;
        this._configuration = this._build_configuration(configuration || {});
        this._raw_path = path;
        this._path = this._build_path(path);
        this._friendly_name = configuration?.friendly_name || undefined;
        this._server.add_route(this);

        // -- Split the middleware object
        const split_middleware = GenericMiddleware.split_runtime_object(configuration?.middleware);
        this._before_middleware = split_middleware.before;
        this._after_middleware = split_middleware.after;

        // -- Create a no method error
        this._no_method_error = {
            method: 'GET',
            before_middleware: {},
            after_middleware: {},
            callback: async () => { throw new RouteHandlerExecutedError('No handler has been assigned for this method', 404); },
            validate: async () => { throw new RouteHandlerExecutedError('No handler has been assigned for this method', 404); }
        };
    };



    public static defualt_configuration: RouteConfiguration<
        MiddlewareNamespace.MiddlewareObject,
        MiddlewareNamespace.MiddlewareObject
    > = {
        friendly_name: 'Unnamed Route',
        api_version: undefined,
        middleware: {}
    };



    /**
     * @name _build_configuration
     * @description Builds the configuration for the route
     * using the default configuration as a base
     * 
     * @param {RouteConfiguration} configuration - The configuration to build
     * 
     * @returns {RouteConfiguration} - The built configuration
     */
    private _build_configuration = (configuration: RouteConfiguration<ServerMiddleware, AfterMiddleware> | {}): RouteConfiguration<ServerMiddleware, AfterMiddleware> => 
        { return { ...Route.defualt_configuration as RouteConfiguration<ServerMiddleware, AfterMiddleware>, ...configuration, }};



    /**
     * @name _build_path
     * @description Builds the path for the route
     * eg adds the version to the path dynamically
     * so that routes can be sorted by version easily
     * 
     * @param {UrlPath} raw_path - The path to build
     * 
     * @returns {string} - The built path
     */
    private _build_path = (
        raw_path: UrlPath
    ): string => {
        const version = this._configuration.api_version;
        let path = version !== '' || version !==  undefined ? `/${version}/${raw_path}` : `/${raw_path}`;

        // -- Remove any double slashes
        path = path.replace(/\/\//g, '/');

        // -- Remove any trailing slashes
        path = path.replace(/\/$/, '');

        // -- Make sure the path starts with a slash
        path = path.startsWith('/') ? path : `/${path}`;

        return path;
    };



    /**
     * @name _process
     * @description Processes any incoming requests and matches them
     * to any binders
     * 
     * TODO: Move all of this into a 'RequestProcessor' class so that
     * data dosent need to be passed around as much
     */
    private _process = async (
        method: HTTPMethods,
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> => {
        Log.debug(`Processing route: ${this._path} with method: ${method}`)

        // -- Get the binders for the method
        let binder = this._binder_map.get(method);
        if (!binder) binder = this._no_method_error;

        // -- Execute the request
        const incoming_request = new RequestProcessor(request, reply, binder);
        await incoming_request.execute();
    };



    /**
     * @name listen
     * Adds the route to the fastify instance
     *
     * @param {FastifyInstance} fastify_instance - The fastify instance to add the route to
     *
     * @returns {void} - Nothing
     */
    public listen = (
        fastify_instance: FastifyInstance
    ): void => {

        const path = this._path,
            methods: Array<HTTPMethods> = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

        methods.forEach(method => fastify_instance.route({
            method: method,
            url: `${path}`,
            handler: async (request: FastifyRequest, reply: FastifyReply) => 
                await this._process(method, request, reply)
        }));

        Log.info(`Route: ${path} has been added to the rerver`);
    };



    /**
     * @name add_binder
     * Adds a binder to the route
     * 
     * @param {BinderNamespace.MapObject} binder - The binder to add
     * 
     * @returns {void} - Nothing
     */
    public add_binder = (
        binder: BinderNamespace.MapObject
    ): void => {
        const method = binder.method;
        if (this._raw_binder_map.has(method)) throw new RouteHandlerExecutedError('A handler has already been added for this method');
        this._raw_binder_map.set(method, binder);
    };



    /**
     * @name _compile_binder
     * DO NOT USE THIS FUNCTION, IT IS FOR INTERNAL USE ONLY
     * BY THE SERVER CLASS
     */
    public _compile_binder = () => {
        for (const [method, binder] of this._raw_binder_map) this._binder_map.set(method, {
            ...binder,
            after_middleware: { ...this._after_middleware, ...binder.after_middleware },
            before_middleware: { ...this._before_middleware, ...binder.before_middleware }
        });

        this._no_method_error.before_middleware = this._before_middleware;
        this._no_method_error.after_middleware = this._after_middleware;
    };




    /**
     * @name add_middleware
     * Adds a middleware to the route, note, adding middleware this way
     * wont give you type inference, pass it trough a configuration object
     * trough the binder / route / server instead
     * 
     * @param {string} name - The name of the middleware
     * @param {MiddlewareNamespace.GenericMiddlewareConstructor} middleware - The middleware to add
     * 
     * @returns {void} - Nothing
     */
    public add_middleware = (
        name: string,
        middleware: MiddlewareNamespace.GenericMiddlewareConstructor,
        runtime: MiddlewareNamespace.MiddlewareRuntime
    ): void => {
        // -- Ensure both objects are set
        if (!this._before_middleware) this._before_middleware = {};
        if (!this._after_middleware) this._after_middleware = {};

        // -- Add the middleware
        if (runtime === MiddlewareNamespace.MiddlewareRuntime.BEFORE) this._before_middleware[name] = middleware;
        else this._after_middleware[name] = middleware;
    };
    


    public get raw_path(): UrlPath { return this._raw_path; }
    public get path(): string { return this._path; }
    public get id(): string { return this._id; }
    public get friendly_name(): string | undefined { return this._friendly_name; }
}