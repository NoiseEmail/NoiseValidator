import { Route } from '../route';
import Log, { _debug_mode } from '../logger/log';
import Fastify, {FastifyInstance} from 'fastify';
import { OptionalServerConfiguration, ServerConfiguration } from './types';
import { DefualtServerConfiguration } from '.';



export default class Server {

    private _routes: Map<String, Route<any>>;
    private _server: FastifyInstance;
    private _configuration: ServerConfiguration;
    private _started: boolean = false;

    public constructor(
        configuration: OptionalServerConfiguration = {}
    ) {
        Log.info('Creating rerver...');
        this._routes = new Map();
        this._server = Fastify({ logger: false });
        this._configuration = Server.build_configuration(configuration);
    }




    public static build_configuration = (configuration: ServerConfiguration | {}): ServerConfiguration => {
        return {
            ...DefualtServerConfiguration,
            ...configuration
        };
    };



    /**
     * @name start
     * Starts the server (Or unpauses it)
     *
     * @returns {void} - Nothing
     */
    public async start(
    ): Promise<void> {

        // -- Don't start the server if it's already started
        if (this._started) {
            Log.warn('Server already started!');
            return Promise.resolve();
        }
        
        
        // -- Start the server
        Log.info('Starting server...');
        this._started = true;
        
        return new Promise<void>((resolve) => this._server.listen({
            port: this.configuration.port,
            host: this.configuration.host
        }, (err, address) => {
            if (err) process.exit(1);
            Log.info(`Server listening at ${address}`);
            resolve();
        }));
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
    };



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
    };



    public get configuration(): ServerConfiguration { return this._configuration; }
    public get port(): number { return this._configuration.port; }
    public get host(): string { return this._configuration.host; }
    public get started(): boolean { return this._started; }
    public get address(): string { return `${this.host}:${this.port}`; }
}