import Route from './route';
import Log from "../logger/log";
import Fastify, {FastifyInstance} from 'fastify';

export default class Router {

    private static _instance: Router;
    private _routes: Map<String, Route>;
    private _server: FastifyInstance;



    private constructor() {
        Log.info('Creating router...');
        this._routes = new Map();
        this._server = Fastify({ logger: false });
    }



    public static get instance(): Router {
        if (!Router._instance) Router._instance = new Router();
        return Router._instance;
    }



    /**
     * @name start
     * Starts the server (Or unpauses it)
     *
     * @returns {void} - Nothing
     */
    public start(): void {
        Log.info('Starting server...');
        this._server.listen({port: 3000}, (err, address) => {
            if (err) {
                Log.error(err);
                process.exit(1);
            }
            Log.info(`Server listening at ${address}`);
        });
    }



    /**
     * @name stop
     * Stops / pauses the server
     *
     * @returns {Promise<void>} - Nothing
     */
    public stop(): Promise<void> {
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
    public add_route(route: Route): void {

        // -- Don't add the route if it already exists
        if (this._routes.has(route.computed_path)) {
            Log.warn(`Route ${route.friendly_name} already exists!`);
            return;
        }

        // -- Add the route
        Log.debug(`Adding route: ${route.friendly_name} (/${route.computed_path})`);
        this._routes.set(route.computed_path, route);
        route.listen(this._server);
    }
}