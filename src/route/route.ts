import { BinderNamespace, BinderOutputValidatorResult, Cookie } from 'noise_validator/src/binder/types';
import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify';
import { GenericError } from 'noise_validator/src/error';
import { create_set_cookie_header, Log, MethodNotAvailableError, NoRouteHandlerError } from '..';
import { OptionalRouteConfiguration, RouteConfiguration } from './types.d';
import { RouteHandlerExecutedError, UnkownRouteHandlerError, MiddlewareExecutionError } from './errors';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { v4 } from 'uuid';
import { Execute, GenericMiddleware } from 'noise_validator/src/middleware';
import { Server } from 'noise_validator/src/server';



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
    private _binder_map: BinderNamespace.Binders = new Map();
    private _server: Server<ServerMiddleware>;
    private _configuration: RouteConfiguration<ServerMiddleware, AfterMiddleware>;
    private _router_middleware: RouteMiddleware;
    private _middleware: MiddlewareNamespace.MiddlewareObject = {};
    private _after_middleware: MiddlewareNamespace.MiddlewareObject = {};

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
    
        this._router_middleware = GenericMiddleware.extract_runtime_object<RouteMiddleware>(configuration?.middleware);
        Object.keys(this._router_middleware).forEach(key => this.add_middleware(key, this._router_middleware[key]));
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
     * @name send_exception
     * @description Sends an exception to the client, formatted as a JSON object
     * use this to send exceptions to the client, as it will be in a
     * consistent format
     * 
     * @param {FastifyReply} reply - The fastify reply object
     * @param {GenericErrorLike} error - The error to send
     * 
     * @returns {void} - Nothing
     */
    public send_exception = (
        reply: FastifyReply,
        errors: Array<GenericError>
    ): void => {

        // -- Get the latest error
        if (errors.length < 1) errors.push(new GenericError('An unknown error occurred', 500));
        const latest = errors[errors.length - 1];
        errors.shift();

        // -- Send the error
        try {
            reply.code(latest.code).send({
                message: latest.message,
                id: latest.id,
                data: latest.data,
                hint: latest.hint,
                type: latest.type,
                errors: errors.map(e => e.serialize()),
                code: latest.code
            });
        }

        catch (unknown_error) {
            Log.error('!!!!!!! IMPORTANT !!!!!!!');
            Log.error(unknown_error);
            Log.error('An unknown error occurred while sending an error to the client');
            Log.error('This is a critical error, please investigate');
            Log.error('!!!!!!! IMPORTANT !!!!!!!');
        };
    };



    /**
     * @name _process
     * @description Processes any incoming requests and matches them
     * to any binders
     */
    private _process = async (
        method: HTTPMethods,
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> => {
        Log.debug(`Processing route: ${this._path} with method: ${method}`)

        // -- Get the binders for the method
        const binder = this._binder_map.get(method);
        if (!binder) return this.send_exception(reply, [new MethodNotAvailableError(method)]);

        // -- Loop through the binders
        const errors: Array<GenericError> = [];
        let error_cookies = new Map<string, Cookie.Shape>();
        let error_headers = new Map<string, string>();
        let middleware_cookies = new Map<string, Cookie.Shape>();
        let middleware_headers = new Map<string, string>();
        let dynamic_after_middleware: MiddlewareNamespace.MiddlewareObject = {};
        let binder_return_data: BinderOutputValidatorResult = { body: {}, headers: {} };
        let binder_errored = false;
        let middleware_errored = false;
        
        try {
            // -- Execute the middleware
            const middleware = await Execute.many(this._middleware || {}, { request, reply });
            if (middleware.overall_success === false) {
                Log.debug(`Route: ${this._path} has FAILED to process PRE middleware validation`);
                this._parse_middleware_response(middleware.middleware, errors, error_cookies, error_headers);
                middleware_errored = true;
                throw new Error('Route / Server Middleware failed');
            };


            // -- Execute the binder
            let validator_result: BinderNamespace.ValidateDataReturn;
            try { validator_result = await binder.validate(request, reply); }
            catch (unknown_error) {
                errors.push(GenericError.from_unknown(unknown_error));
                Log.debug(`Route: ${this._path} has VALIDATE FAILED to process`);
                middleware_errored = true;
                throw new Error('Binder failed execution');
            }


            Log.debug(`Route: ${this._path} has PASSED schema validation`);
            dynamic_after_middleware = validator_result.filterd_out;
            switch (validator_result.success) {

                // -- If the middleware has passed, execute the callback
                //    the callback it self will handle the response
                case true: {
                    Log.debug(`Route: ${this._path} has PASSED middleware validation`);

                    // -- Merge the middleware respones
                    validator_result.middleware = { ...validator_result.middleware, ...middleware.data };
                    validator_result.middleware_cookies = new Map([...validator_result.middleware_cookies, ...middleware.cookies]);
                    validator_result.middleware_headers = new Map([...validator_result.middleware_headers, ...middleware.headers]);

                    try { 
                        binder_return_data = await binder.callback(validator_result); 
                        middleware_cookies = validator_result.middleware_cookies;
                        middleware_headers = validator_result.middleware_headers;
                    }
                    catch (unknown_error) { 
                        Log.debug(`Route: ${this._path} has BINDER Callback FAILED to process`);
                        errors.push(UnkownRouteHandlerError.from_unknown(unknown_error)); 
                        binder_errored = true;
                    };

                    break;
                }


                // -- Set the failed middleware cookies and headers as these were explicitly set
                //    by the middleware to be sent regardless of the success of the middleware
                case false: {
                    Log.debug(`Route: ${this._path} has FAILED middleware validation`);
                    this._parse_middleware_response(validator_result.middleware, errors, error_cookies, error_headers);
                    middleware_errored = true;
                    break;
                }
            }
        } 
        
        // -- Log the error, just for debugging purposes
        catch(error) { Log.debug(`Route: ${this._path} has FAILED to process`); };
        

        // -- Process the after middleware
        const after_middleware_result = await this._process_after_middleware(
            request, 
            reply, 
            dynamic_after_middleware, 
            errors, 
            error_cookies, 
            error_headers, 
            middleware_cookies, 
            middleware_headers, 
            middleware_errored
        );

        // -- Set the middleware responses
        middleware_cookies = after_middleware_result.middleware_cookies
        middleware_headers = after_middleware_result.middleware_headers;
        middleware_errored = after_middleware_result.middleware_errored;
        error_cookies = after_middleware_result.error_cookies;
        error_headers = after_middleware_result.error_headers;

        // -- Send the response
        this._send_response(
            binder_return_data, 
            middleware_cookies, 
            middleware_headers, 
            binder_errored, 
            middleware_errored, 
            errors, 
            error_cookies, 
            error_headers, 
            reply
        );
    };



    /**
     * Handles the after middleware execution and processing
     */
    private _process_after_middleware = async (
        request: FastifyRequest,
        reply: FastifyReply,
        dynamic_after_middleware: MiddlewareNamespace.MiddlewareObject,
        errors: Array<GenericError>,
        error_cookies: Map<string, Cookie.Shape>,
        error_headers: Map<string, string>,
        middleware_cookies: Map<string, Cookie.Shape>,
        middleware_headers: Map<string, string>,
        middleware_errored: boolean
    ): Promise<{
        middleware_cookies: Map<string, Cookie.Shape>,
        middleware_headers: Map<string, string>,
        middleware_errored: boolean,
        error_cookies: Map<string, Cookie.Shape>,
        error_headers: Map<string, string>,
    }> => {

        try {
            // -- Same func as the before middleware, just different runtime
            const after_middleware = await Execute.many({ 
                ...this._after_middleware, 
                ...dynamic_after_middleware 
            }, { request, reply }, MiddlewareNamespace.MiddlewareRuntime.BEFORE);
            
            // -- Attempt to gracefully handle the error
            if (after_middleware.overall_success === false) {
                Log.debug(`Route: ${this._path} has FAILED to process AFTER middleware validation`);
                this._parse_middleware_response(after_middleware.middleware, errors, error_cookies, error_headers);
                throw new MiddlewareExecutionError('_process_after_middleware has failed to execute after middlewares');
            }

            // -- Merge the middleware respones
            middleware_cookies = new Map([...middleware_cookies, ...after_middleware.cookies]);
            middleware_headers = new Map([...middleware_headers, ...after_middleware.headers]);
        }

        catch (unknown_error) {
            errors.push(GenericError.from_unknown(unknown_error));
            Log.debug(`Route: ${this._path} has FAILED to process AFTER middleware validation`);
            middleware_errored = true;
        };

        return { 
            middleware_cookies,
            middleware_headers, 
            middleware_errored,
            error_cookies,
            error_headers
        };
    };



    /**
     * Handles sending the response to the client
     */
    private _send_response = (
        binder_return_data: BinderOutputValidatorResult,
        middleware_cookies: Map<string, Cookie.Shape>,
        middleware_headers: Map<string, string>,
        binder_errored: boolean,
        middleware_errored: boolean,
        errors: Array<GenericError>,
        error_cookies: Map<string, Cookie.Shape>,
        error_headers: Map<string, string>,
        reply: FastifyReply
    ): void => {

        try {
            if (binder_errored || middleware_errored) {
                console.log('binder_errored', binder_errored);
                // -- Merge the cookies / headers
                middleware_cookies = new Map([...middleware_cookies, ...error_cookies]);
                middleware_headers = new Map([...middleware_headers, ...error_headers]);

                // -- Set the cookies and headers
                if (middleware_cookies.size > 0) middleware_headers.set('Set-Cookie', create_set_cookie_header(middleware_cookies));
                middleware_headers.forEach((value, key) => reply.header(key, value));
    
                // -- This area is only reached if no valid handler is found
                if (errors.length < 1) errors.push(new NoRouteHandlerError('No valid handler found for this route'));
                this.send_exception(reply, errors);
    
                return;
            }
    

            // -- Set the cookies and headers
            reply.headers(binder_return_data.headers);
            if (middleware_cookies.size > 0) middleware_headers.set('Set-Cookie', create_set_cookie_header(middleware_cookies));
            middleware_headers.forEach((value, key) => reply.header(key, value));
    
            // -- Send the response
            reply.send(binder_return_data.body);
        }

        catch (unknown_error) {
            Log.error('An unknown error occurred while sending the response');
            Log.error(unknown_error);
            this.send_exception(reply, [GenericError.from_unknown(unknown_error)]);
        };
    };



    /**
     * @name _parse_middleware_response
     */
    private _parse_middleware_response = (
        middleware_result: MiddlewareNamespace.MiddlewareValidationMap,
        errors: Array<GenericError>,
        error_cookies: Map<string, Cookie.Shape>,
        error_headers: Map<string, string>
    ) => (middleware_result as MiddlewareNamespace.MiddlewareValidationMap).forEach((middleware) => {
        if (middleware.success) return;
        middleware.cookies.forEach((value, key) => error_cookies.set(key, value));
        middleware.headers.forEach((value, key) => error_headers.set(key, value));
        errors.push(middleware.data);
    });



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
            methods: Array<HTTPMethods> = ['GET', 'POST', 'PUT', 'DELETE'];

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
        if (this._binder_map.has(method)) throw new RouteHandlerExecutedError('A handler has already been added for this method');
        this._binder_map.set(method, binder);
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
        middleware: MiddlewareNamespace.GenericMiddlewareConstructor
    ): void => {
        
        // -- Check if the middleware is a before or after middleware
        // @ts-ignore
        if (middleware.runtime === MiddlewareNamespace.MiddlewareRuntime.BEFORE) this._middleware[name] = middleware;
        else this._after_middleware[name] = middleware;
    };
    


    public get raw_path(): UrlPath { return this._raw_path; }
    public get path(): string { return this._path; }
    public get id(): string { return this._id; }
    public get friendly_name(): string | undefined { return this._friendly_name; }
}