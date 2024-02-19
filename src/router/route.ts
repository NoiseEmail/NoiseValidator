import Router from "./router";
import {RouterTypes} from "./types";
import {FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods} from "fastify";
import Log from "../logger/log";
import Binder from "./binder";
import ParserError from "../parser/error";


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
     * @param {HTTPMethods} method - The method to find a route for
     * @param {FastifyRequest} fastify_request - The request to find a route for
     *
     * @returns {Promise<RouterTypes.Binder.Generic | null | ParserError>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: HTTPMethods,
        fastify_request: FastifyRequest
    ): Promise<
        RouterTypes.Router.RouteCompatibleObject |
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



    private _process = async(
        method: HTTPMethods,
        fastify_request: FastifyRequest,
        fastify_reply: FastifyReply,
    ): Promise<any> => {
        const result = await this._find_compatible_route(method, fastify_request);

        if (!result) return fastify_reply.code(404).send({error: 'No route found'});
        if (result instanceof ParserError) return fastify_reply.code(400).send({error: result.message});

        // -- Process the route
        let processed_request: RouterTypes.Router.ExecutableReturnable | null = null;
        try {
            processed_request = await result.binder.process(
                fastify_request,
                fastify_reply,
                result.body,
                result.query,
                result.headers
            );
        }

        catch (error) {
            Log.error('Error processing request:', error);
            return fastify_reply.code(500).send({error: 'Internal Server Error'});
        }

        // -- Check if the response was used up
        if (fastify_reply.sent) {
            Log.warn('Response was already sent, server will not respond in expected manner');
            return;
        }

        // -- Ensure a response is sent
        let response: RouterTypes.Router.ReturnableObject;
        if (processed_request) response = processed_request;
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

        const path = this._computed_path,
            methods: Array<HTTPMethods> = ['GET', 'POST', 'PUT', 'DELETE'];

        methods.forEach(method => fastify_instance.route({ 
            method: method, 
            url: `/${path}`, 
            handler: async (request, reply) => this._process(method, request, reply) 
        }));

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