import Router from "./router";
import {RouterTypes} from "./types";



export default class Route {

    private readonly _friendly_name: String;
    private readonly _computed_path: String;
    private readonly _path: Array<String>

    private _router_instance: Router;
    private _configuration: RouterTypes.RouteConfiguration;
    private _binds: Array<RouterTypes.GenericRouteParameters> = [];
    private _router_map: RouterTypes.Router.RouteMap = new Map();

    public constructor(
        configuration: RouterTypes.RouteConfiguration,
        binds: Array<RouterTypes.GenericRouteParameters>
    ) {
        this._path = configuration.path;
        this._friendly_name = configuration.friendly_name;
        this._computed_path = this._compute_path();
        this._router_instance = Router.instance;
        this._configuration = configuration;
        this._binds = binds;
    }

    public static new = <
        Body extends RouterTypes.Binder.RequiredBody,
        Query extends RouterTypes.Binder.RequiredQuery,
        Headers extends RouterTypes.Binder.RequiredHeaders
    >(
        configuration: RouterTypes.NewRouteParameters<Body, Query, Headers>
    ): Route => new Route(
        configuration.configuration,
        // @ts-ignore
        configuration.binders
    );



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
     * @returns {Promise<RouterTypes.GenericRouteParameters | null>} - Returns a promise that resolves to either a route or null
     */
    private async _find_compatible_route(
        method: RouterTypes.Method,
        body: object,
        query: object,
        headers: object
    ): Promise<RouterTypes.GenericRouteParameters | null> {

        const routes = this._router_map.get(method);
        if (!routes) return null;

        for (let i = 0; i < routes.length; i++) {

        }

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