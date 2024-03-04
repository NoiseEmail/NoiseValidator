import Router from './router';
import {FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods} from 'fastify';
import Log from '../logger/log';
import Binder from '../binder/binder';
import ParserError from '../parser/error';
import RouterError from './error';

import { Router as RouterType } from './types';
import { Binder as BinderType } from '../binder/types';

export default class Route<
    UrlPath extends string,
    Configuration extends RouterType.Configuration<UrlPath>
> {

    private readonly _friendly_name: String;
    private readonly _path: String;

    private _router_instance: Router;
    private _configuration: Configuration;

    private _binder_map: RouterType.BinderMap = new Map();

    public constructor(
        configuration: Configuration,
    ) {
        this._path = configuration.path;
        this._friendly_name = configuration.friendly_name;
        this._router_instance = Router.instance;
        this._configuration = configuration;
    }

    public static new = <path extends string>(
        configuration: RouterType.Configuration<path>,
    ): Route<path, RouterType.Configuration<path>> => new Route(
        configuration,
    ); 


    /**
     * @name bind
     * Binds a 'Binder' object to the route instance, allowing traffic
     * that matches the binder to be routed to that binder's handler.
     *
     * @param {typeof Binder} binder - The binder to bind to the route
     * @returns {Route} - Returns the route instance (For chaining)
     */
    public bind = (
        binder: BinderType.Any
    ): this => {
        if (!this._binder_map.has(binder.method)) this._binder_map.set(binder.method, []);
        this._binder_map.get(binder.method)?.push(binder);
        return this;
    }


    /**
     * @name _find_compatible_route
     * @async
     *
     * Finds a route that is compatible with the given method
     * Body, Query and headers.
     *
     * @param {HTTPMethods} method - The method to find a route for
     * @param {FastifyRequest} fastify_request - The request to find a route for
     *
     * @returns {Promise<Binder.Generic | null | ParserError>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: HTTPMethods,
        fastify_request: FastifyRequest
    ): Promise<
        RouterType.RouteCompatibleObject |
        null |
        ParserError
    > {

        // -- Get all the possible routes for the given method
        const binders = this._binder_map.get(method);
        if (!binders) return null;
        let error: ParserError | null = null;

        // -- Iterate over the routes and find the first one that matches
        for (const bind of binders) {
            const result = await bind.validate(fastify_request);
            if (result instanceof ParserError) error = result;
            else return result;
        }

        return error;
    }



    private _process = async (
        method: HTTPMethods,
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply,
    ): Promise<any> => {
        const result = await this._find_compatible_route(method, fastify_request);

        if (!result) return fastify_reply.code(404).send({error: 'No route found'});
        if (result instanceof ParserError) return fastify_reply.code(400).send({error: result.message});

        // -- Process the route
        let processed_request: RouterType.ExecutableReturnable | null = null;
        try {
            processed_request = await result.binder.process(
                fastify_request,
                fastify_reply,
                result.body,
                result.query,
                result.headers
            );
        } catch (error) {
            Log.error('Error processing request:', error);
            return fastify_reply.code(500).send({error: 'Internal Server Error'});
        }

        // -- Check if the response was used up
        if (fastify_reply.sent) {
            Log.warn('Response was already sent, server will not respond in expected manner');
            return;
        }

        // -- Ensure a response is sent
        let response: RouterType.ReturnableObject;

        if (processed_request instanceof RouterError) {
            // processed_request.path = this._path;
            response = Binder.respond(processed_request.serialized.code, processed_request.serialized);
        } else if (processed_request) response = processed_request;
        else response = Binder.respond('200_OK', {});

        // -- Send the response
        if (response.content_type) fastify_reply.header('Content-Type', response.content_type);
        fastify_reply.code(Binder.response_code(response.status)).send(response.body);
    }


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


    public get friendly_name(): String {
        return this._friendly_name;
    }

    public get path(): String {
        return this._path;
    }
}