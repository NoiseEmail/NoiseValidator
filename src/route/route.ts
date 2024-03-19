import { randomUUID } from "crypto";
import { BinderMap, BinderMapObject } from "../binder/types";
import { RouteConfiguration } from "./types";
import { Log, MethodNotAvailableError, NoRouteHandlerError, Router } from "..";
import { FastifyInstance, FastifyReply, HTTPMethods } from "fastify";
import { GenericError } from "../error/types";

export default class Route<
    UrlPath extends string
> {
    public readonly _path: UrlPath;
    public readonly _id: string = randomUUID();

    private _friendly_name: string | undefined;
    private _binder_map: BinderMap = new Map();
    private _router: Router = Router.instance;


    public constructor(
        path: UrlPath,
        configuration?: RouteConfiguration
    ) {
        this._path = path;
        this._friendly_name = configuration?.friendly_name || undefined;
        this._router.add_route(this);
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
        error: GenericError.GenericErrorLike
    ): void => {};



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

        // -- Get the binders for the method
        const binders = this._binder_map.get(method);
        if (!binders || binders.length < 0) return this.send_exception(reply, new MethodNotAvailableError(method));

        // -- Loop through the binders
        const errors: Array<GenericError.GenericErrorLike> = [];
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
                if (validator_result instanceof GenericError.GenericErrorLike) errors.push(validator_result);
                else {
                    const callback_result = await binder.callback(validator_result);
                    if (callback_result instanceof GenericError.GenericErrorLike) errors.push(callback_result);
                    else return;
                }
            }

            catch (error) {
                if (error instanceof GenericError.GenericErrorLike) errors.push(error);
                else {
                    const generic_error = new GenericError.GenericErrorLike('An error occurred');
                    generic_error.data = { error };
                    errors.push(generic_error);
                }
            }
        }

        // -- Send the exception with the errors if debug is enabled
        const error = new NoRouteHandlerError('No valid handler found for this route');
        if (this._router.debug) error.data = errors;
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
}