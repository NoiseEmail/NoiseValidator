import Router from "./router";
import {RouterTypes} from "./types";
import Binder from "./binder";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import ParserError from "./parser/parser_error";
import Log from "../logger/log";


export default class Route {

    private readonly _friendly_name: String;
    private readonly _computed_path: String;
    private readonly _path: Array<String>

    private _router_instance: Router;
    private _configuration: RouterTypes.RouteConfiguration;

    private _binders: Array<RouterTypes.Binder.Generic> = [];
    private _router_map: RouterTypes.Router.RouteMap = new Map();

    public constructor(
        configuration: RouterTypes.RouteConfiguration,
        ...binders: Array<RouterTypes.Binder.Generic>
    ) {
        this._path = configuration.path;
        this._friendly_name = configuration.friendly_name;
        this._computed_path = this._compute_path();
        this._router_instance = Router.instance;
        this._configuration = configuration;
        this._binders = binders;
    }

    public static new = (
        configuration: RouterTypes.RouteConfiguration,
        ...binders: Array<RouterTypes.Binder.Generic>
    ): Route => new Route(
        configuration,
        ...binders
    );



    /**
     * @name bind
     * Binds a 'Binder' object to the route instance, allowing traffic
     * that matches the binder to be routed to that binder's handler.
     *
     * @param {typeof Binder} binder - The binder to bind to the route
     * @returns {Route} - Returns the route instance (For chaining)
     */
    public bind =(
        binder: RouterTypes.Binder.Generic
    ): this => {
        if (!this._router_map.has(binder.method)) this._router_map.set(binder.method, []);
        this._router_map.get(binder.method)?.push(binder);
        this._binders.push(binder);
        return this;
    }



    /**
     * @name _find_compatible_route
     * @async
     *
     * Finds a route that is compatible with the given method
     * Body, Query and headers.
     *
     * @param {RouterTypes.Method} method - The method to find a route for
     * @param {FastifyRequest} fastify_request - The request to find a route for
     *
     * @returns {Promise<RouterTypes.Binder.Generic | null | ParserError>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: RouterTypes.Method,
        fastify_request: FastifyRequest
    ): Promise<
        RouterTypes.Binder.RouteCompatibleObject |
        null |
        ParserError
    > {

        // -- Get all the possible routes for the given method
        const routes = this._router_map.get(method);
        if (!routes) return null;
        let error: ParserError | null = null;

        // -- Iterate over the routes and find the first one that matches
        for (const route of routes) {
            const result = await route.validate(fastify_request);
            if (result instanceof ParserError) error = result;
            else return result;
        }

        return error;
    }



    public listen = (
        fastify_instance: FastifyInstance
    ): void => {

        const process = async(
            method: RouterTypes.Method,
            fastify_request: FastifyRequest,
            fastify_reply: FastifyReply,
        ): Promise<any> => {
            const result = await this._find_compatible_route(method, fastify_request);

            if (!result) return fastify_reply.code(404).send({error: 'No route found'});
            if (result instanceof ParserError) return fastify_reply.code(400).send({error: result.message});

            return result.binder.process(fastify_request, fastify_reply, result.body, result.query, result.headers);
        }


        const path = this._computed_path;
        fastify_instance.route({ method: 'GET', url: `/${path}`, handler: async (request, reply) => process('GET', request, reply) });
        fastify_instance.route({ method: 'POST', url: `/${path}`, handler: async (request, reply) => process('POST', request, reply) });
        fastify_instance.route({ method: 'PUT', url: `/${path}`, handler: async (request, reply) => process('PUT', request, reply) });
        fastify_instance.route({ method: 'DELETE', url: `/${path}`, handler: async (request, reply) => process('DELETE', request, reply) });

        Log.info(`Route: ${path} has been added to the router`);
    };



    private _compute_path(): String {
        return this._path.join('/');
    }

    public get friendly_name(): String {
        return this._friendly_name;
    }

    public get computed_path(): String {
        return this._computed_path;
    }
}