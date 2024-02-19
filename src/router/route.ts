import Router from "./router";
import {RouterTypes} from "./types";



export default class Route {

    private readonly _friendly_name: String;
    private readonly _computed_path: String;
    private readonly _path: Array<String>

    private _router_instance: Router;
    private _configuration: RouterTypes.RouteConfiguration;

    private _binders: Array<RouterTypes.Binder.GenericParameters> = [];
    private _router_map: RouterTypes.Router.RouteMap = new Map();

    public constructor(
        configuration: RouterTypes.RouteConfiguration,
        ...binders: Array<RouterTypes.Binder.GenericParameters>
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
        ...binders: Array<RouterTypes.Binder.GenericParameters>
    ): Route => new Route(
        configuration,
        ...binders
    );



    public static Binder =<
        Body extends RouterTypes.Binder.RequiredBody,
        Query extends RouterTypes.Binder.RequiredQuery,
        Headers extends RouterTypes.Binder.RequiredHeaders
    >(
        binder: RouterTypes.NewBinder<Body, Query, Headers>
    ): RouterTypes.Binder.GenericParameters => {
        // @ts-ignore
        return binder;
    }


    /**
     * @name bind
     * Binds a 'Binder' object to the route instance, allowing traffic
     * that matches the binder to be routed to that binder's handler.
     *
     * @param {RouterTypes.Binder.GenericParameters} parameters - The parameters to bind
     * @returns {Route} - Returns the route instance (For chaining)
     */
    public bind = <
        Body extends RouterTypes.Binder.RequiredBody,
        Query extends RouterTypes.Binder.RequiredQuery,
        Headers extends RouterTypes.Binder.RequiredHeaders
    >(
        parameters: RouterTypes.NewBinder<Body, Query, Headers>
    ): this => {
        if (!this._router_map.has(parameters.method)) this._router_map.set(parameters.method, [])
        // @ts-ignore
        this._router_map.get(parameters.method)?.push(parameters);
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
     * @returns {Promise<RouterTypes.Binder.GenericParameters | null>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: RouterTypes.Method,
        body: object,
        query: object,
        headers: object
    ): Promise<RouterTypes.Binder.GenericParameters | null> {

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