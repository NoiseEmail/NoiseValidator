import Router from "./router";
import {RouterTypes} from "./types";
import Binder from "./binder";


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
     * @param {object} body - The body to find a route for
     * @param {object} query - The query to find a route for
     * @param {object} headers - The headers to find a route for
     *
     * @returns {Promise<RouterTypes.Binder.Generic | null>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: RouterTypes.Method,
        body: object,
        query: object,
        headers: object
    ): Promise<RouterTypes.Binder.Generic | null> {

        const routes = this._router_map.get(method);
        if (!routes) return null;


        return null;
    }



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