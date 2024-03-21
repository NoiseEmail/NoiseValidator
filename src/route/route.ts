import { randomUUID } from "crypto";
import { BinderCallbackObject, BinderMap, BinderMapObject } from "../binder/types.d";
import { RouteConfiguration } from "./types.d";
import { Log, MethodNotAvailableError, NoRouteHandlerError, Router } from "..";
import { FastifyInstance, FastifyReply, HTTPMethods } from "fastify";
import { GenericError } from "../error";

export default class Route<
    UrlPath extends string
> {
    public readonly _path: UrlPath;
    public readonly _id: string = randomUUID();

    private _friendly_name: string | undefined;
    private _binder_map: BinderMap = new Map();
    private _router: Router = Router.instance;
    private _added_to_router: boolean = false;

    public constructor(
        path: UrlPath,
        configuration?: RouteConfiguration
    ) {
        this._path = path;
        this._friendly_name = configuration?.friendly_name || undefined;
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
        error: GenericError
    ): void => {
        if (this._router.configuration.debug) Log.error(error.message);

        reply.code(error.code).send({
            error: {
                message: error.message,
                data: error.data
            }
        });
    };



    /**
     * @name add_to_router
     * @description Adds the route to the router
     * 
     * @returns {void} - Nothing
     */
    public add_to_router = (): void => {
        if (this._added_to_router) return Log.warn(`Route: ${this._path} has already been added to the router`);
        this._router.add_route(this);
        this._added_to_router = true;
    }



    /**
     * @name _process
     * @description Processes any incoming requests and matches them
     * to any binders
     */
    private _process = async (
        method: HTTPMethods,
        request: any,
        reply: any
    ): Promise<void> => {
        if (this._router.configuration.debug) Log.debug(`Processing route: ${this._path} with method: ${method}`)

        // -- Get the binders for the method
        const binders = this._binder_map.get(method);
        if (!binders || binders.length < 0) return this.send_exception(reply, new MethodNotAvailableError(method));

        // -- Loop through the binders
        const errors: Array<GenericError> = [];
        let error_response: GenericError | undefined;
        for (let i = 0; i < binders.length; i++) {

            // -- Check if the response has been sent
            if (reply.sent) return Log.warn(`
                Path: ${this._path}
                Method: ${method}
                A response has been sent outside of the route handler
            `);

            try {
                const binder = binders[i];

                const validator_result = await binder.validate(request, reply);
                if (GenericError.is_generic_error(validator_result)) {
                    if (this._router.configuration.debug) Log.debug(`Route: ${this._path} has FAILED validation`);
                    errors.push(validator_result as GenericError);
                }

                else {
                    if (this._router.configuration.debug) Log.debug(`Route: ${this._path} has been validated`);
                    const callback_result = await binder.callback(validator_result as BinderCallbackObject<any, any, any, any, any>);

                    if (GenericError.is_generic_error(callback_result)) {
                        if (this._router.configuration.debug) Log.debug(`Route: ${this._path} has returned an error`);
                        error_response = callback_result as GenericError;
                        break;
                    }
                    
                    else return (this._router.configuration.debug) ? Log.debug(`Route: ${this._path} has been processed`) : void (0);
                }
            }

            catch (error) {
                if (this._router.configuration.debug) Log.debug('CATCH', error);
                if (GenericError.is_generic_error(error)) errors.push(error as GenericError);
                else {
                    const generic_error = new GenericError('An error occurred', 500);
                    generic_error.data = { error };
                    errors.push(generic_error);
                }
            }
        }

        // -- Send the exception with the errors if debug is enabled
        let error = new NoRouteHandlerError('No valid handler found for this route');
        if (error_response) error = error_response;
        if (this._router.configuration.debug) error.data = {errors};
        this.send_exception(reply, error);
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

        Log.info(`Route: ${path} has been added to the router`);
    };



    /**
     * @name add_binder
     * Adds a binder to the route
     * 
     * @param {BinderMapObject} binder - The binder to add
     * 
     * @returns {void} - Nothing
     */
    public add_binder = (
        binder: BinderMapObject
    ): void => {
        const method = binder.method;
        if (!this._binder_map.has(method)) this._binder_map.set(method, []);
        this._binder_map.get(method)?.push(binder);
    };

    

    public get path(): UrlPath { return this._path; }
    public get id(): string { return this._id; }
    public get friendly_name(): string | undefined { return this._friendly_name; }
    public get debug(): boolean { return this._router.configuration.debug; }
}