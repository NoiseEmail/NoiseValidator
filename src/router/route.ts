import Router from "./router";
import {RouterTypes} from "./types";

export default class Route {

    private _computed_path: String;
    private _path: Array<String>
    private _route_instance: typeof this;

    protected _router_instance: Router;
    private _friendly_name: String;
    private _configuration: RouterTypes.RouteConfiguration;


    private constructor(
        configuration: RouterTypes.RouteConfiguration,
    ) {
        this._path = configuration.path;
        this._friendly_name = configuration.friendly_name;
        this._computed_path = this._compute_path();
        this._router_instance = Router.instance;
        this._configuration = configuration;
    }



    private Get = (): void => {};



    private _compute_path(): String {
        return this._path.join('/');
    }

    public get friendly_name(): String {
        return this._friendly_name;
    }

    public get computed_path(): String {
        return this._computed_path;
    }


    public static new = <
        Body extends RouterTypes.Binder.RequiredBody,
        Query extends RouterTypes.Binder.RequiredQuery,
    >(
        configuration: RouterTypes.NewRouteParameters<Body, Query>
    ): Route => {

        // -- Return a new instance of the route
        return new Route(
            configuration.configuration
        );
    }
}