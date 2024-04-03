import { Route } from '../route';
import Log, { _debug_mode } from '../logger/log';
import Fastify, {FastifyInstance} from 'fastify';
import { OptionalRouterConfiguration, RouterConfiguration } from './types';
import { DefualtRouterConfiguration } from '.';
import { mergician } from 'mergician';

export default class Router {

    private static _instance: Router;
    private _routes: Map<String, Route<any>>;
    private _server: FastifyInstance;
    private _configuration: RouterConfiguration = DefualtRouterConfiguration;
    private _started: boolean = false;

    private constructor() {
        Log.info('Creating router...');
        this._routes = new Map();
        this._server = Fastify({ logger: false });
    }



    public static get instance(): Router {
        if (!Router._instance) this._instance = new Router();
        return Router._instance;
    }



    /**
     * @name start
     * Starts the server (Or unpauses it)
     *
     * @param {OptionalRouterConfiguration} configuration - The configuration for the server
     *
     * @returns {void} - Nothing
     */
    public start(
        configuration: OptionalRouterConfiguration = {}
    ): void {
        if (this._started) {
            Log.warn('Server already started!');
            return;
        }
        
        Log.info('Starting server...');
        this._started = true;
        _debug_mode(configuration.debug || false);
        this._configuration = mergician(DefualtRouterConfiguration, configuration) as RouterConfiguration;
        this._server.listen({
            port: configuration.port || 3000,
            host: configuration.host || '0.0.0.0'
        }, (err, address) => {
            if (err) {
                Log.error(err);
                process.exit(1);
            }
            Log.info(`Server listening at ${address}`);
        });
    };



    /**
     * @name stop
     * Stops / pauses the server
     *
     * @returns {Promise<void>} - Nothing
     */
    public stop(): Promise<void> {
        if (!this._started) {
            Log.warn('Server already stopped!');
            return Promise.resolve();
        }

        Log.warn('Stopping server...')
        return this._server.close();
    }



    /**
     * @name add_route
     * Adds a route to the server
     *
     * @param {Route} route - The route to add
     *
     * @returns {void} - Nothing
     */
    public add_route(route: Route<any>): void {

        // -- Don't add the route if it already exists
        if (this._routes.has(route.path)) {
            Log.warn(`Route ${route.friendly_name} already exists!`);
            return;
        }

        // -- Add the route
        Log.debug(`Adding route: ${route.friendly_name} (${route.path})`);
        this._routes.set(route.path, route);
        route.listen(this._server);
    }



    public get configuration(): RouterConfiguration { return this._configuration; }
}