import { BinderNamespace, Cookie } from '@binder/types';
import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify';
import { GenericError } from '@error';
import { create_set_cookie_header, Log, MethodNotAvailableError, NoRouteHandlerError, Server } from '..';
import { OptionalRouteConfiguration, RouteConfiguration } from './types.d';
import { randomUUID } from 'crypto';
import { RouteHandlerExecutedError, UnkownRouteHandlerError } from './errors';
import { MiddlewareNamespace } from '@/middleware/types';



export default class Route<
    UrlPath extends string
> {
    public readonly _raw_path: UrlPath;
    public readonly _path: string;
    public readonly _id: string = randomUUID();

    private _friendly_name: string | undefined;
    private _binder_map: BinderNamespace.Binders = new Map();
    private _rerver: Server;

    private _configuration: RouteConfiguration;

    public constructor(
        rerver: Server,
        path: UrlPath,
        configuration?: OptionalRouteConfiguration
    ) {
        this._rerver = rerver;
        this._configuration = this._build_configuration(configuration || {});
        this._raw_path = path;
        this._path = this._build_path(path);
        this._friendly_name = configuration?.friendly_name || undefined;
        this._rerver.add_route(this);
    };



    public static defualt_configuration: RouteConfiguration = {
        friendly_name: 'Unnamed Route',
        api_version: undefined
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
    private _build_configuration = (
        configuration: RouteConfiguration | {}
    ): RouteConfiguration => {
        return {
            ...Route.defualt_configuration,
            ...configuration
        };
    };



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
        if (errors.length < 1) errors.push(new GenericError('An unknown error occurred', 500));
        const latest = errors[errors.length - 1];
        errors.shift();

        // -- Send the error
        reply.code(latest.code).send({
            message: latest.message,
            id: latest.id,
            data: latest.data,
            hint: latest.hint,
            type: latest.type,
            errors: errors.map(e => e.serialize()),
            code: latest.code
        });
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
        const binders = this._binder_map.get(method);
        if (!binders || binders.length < 1) return this.send_exception(reply, [new MethodNotAvailableError(method)]);

        // -- Loop through the binders
        let errors: Array<GenericError> = [];
        let error_cookies = new Map<string, Cookie.Shape>();
        let error_headers = new Map<string, string>();

        for (let i = 0; i < binders.length; i++) {

            // -- Check if the response has been sent
            if (reply.sent) throw new RouteHandlerExecutedError('A response has been sent outside of the route handler');
            const binder = binders[i];
            errors = [];
            error_cookies = new Map();
            error_headers = new Map();
            

            // -- Execute the binder
            let validator_result: BinderNamespace.ValidateDataReturn;
            try { validator_result = await binder.validate(request, reply); }
            catch (unknown_error) {
                errors.push(GenericError.from_unknown(unknown_error));
                Log.debug(`Route: ${this._path} has FAILED to process`);
                continue;
            }


            Log.debug(`Route: ${this._path} has PASSED schema validation`);
            switch (validator_result.success) {

                // -- If the middleware has passed, execute the callback
                //    the callback it self will handle the response
                case true: {
                    Log.debug(`Route: ${this._path} has PASSED middleware validation`);
                    try { await binder.callback(validator_result, validator_result.middleware_cookies, validator_result.middleware_headers); }
                    catch (unknown_error) {
                        errors.push(UnkownRouteHandlerError.from_unknown(unknown_error));
                        continue;
                    };

                    // -- Exit the loop as the response has been sent
                    return;
                }


                // -- Set the failed middleware cookies and headers as these were explicitly set
                //    by the middleware to be sent regardless of the success of the middleware
                case false: {
                    Log.debug(`Route: ${this._path} has FAILED middleware validation`);
                    (validator_result.middleware as MiddlewareNamespace.MiddlewareValidationMap).forEach((middleware, key) => {
                        if (middleware.success) return;
                        middleware.cookies.forEach((value, key) => error_cookies.set(key, value));
                        middleware.headers.forEach((value, key) => error_headers.set(key, value));
                        errors.push(middleware.data);
                    });

                    // -- Continue to the next binder
                    continue;
                }
            }
        }


        // -- Set the cookies and headers
        if (error_cookies.size > 0) error_headers.set('Set-Cookie', create_set_cookie_header(error_cookies));
        error_headers.forEach((value, key) => reply.header(key, value));



        // -- This area is only reached if no valid handler is found
        if (errors.length < 1) errors.push(new NoRouteHandlerError('No valid handler found for this route'));
        this.send_exception(reply, errors);
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
            methods: Array<HTTPMethods> = ['GET', 'POST', 'PUT', 'DELETE'];

        methods.forEach(method => fastify_instance.route({
            method: method,
            url: `${path}`,
            handler: async (request, reply) => this._process(method, request, reply)
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
        if (!this._binder_map.has(method)) this._binder_map.set(method, []);
        this._binder_map.get(method)?.push(binder);
    };

    

    public get raw_path(): UrlPath { return this._raw_path; }
    public get path(): string { return this._path; }
    public get id(): string { return this._id; }
    public get friendly_name(): string | undefined { return this._friendly_name; }
}