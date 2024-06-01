import Fastify, { FastifyInstance } from 'fastify';
import Log from 'noise_validator/src/logger';
import { DefualtServerConfiguration } from '.';
import { OptionalServerConfiguration, ServerConfiguration } from './types.d';
import { Route } from 'noise_validator/src/route';
import { Http2SecureServer } from 'http2';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';


export default class Server<
    Middleware extends MiddlewareNamespace.MiddlewareObject
> {

    private _routes: Map<String, Route<any, Middleware>>;
    private _server: FastifyInstance;
    private _middleware: Middleware;
    private _configuration: ServerConfiguration<Middleware>;
    private _started: boolean = false;

    public constructor(
        configuration: OptionalServerConfiguration<Middleware> = {}
    ) {
        Log.info('Creating rerver...');
        this._routes = new Map();
        this._server = Fastify({ logger: false });
        this._configuration = Server.build_configuration<Middleware>(configuration);
        this._middleware = this._configuration.middleware ?? {};
    }




    public static build_configuration = <
        MO extends MiddlewareNamespace.MiddlewareObject
    >(configuration: ServerConfiguration<MO> | {}): ServerConfiguration<MO> => {
        return { ...DefualtServerConfiguration, ...configuration } as ServerConfiguration<MO>;
    };



    /**
     * @name start
     * Starts the server
     *
     * @returns {void} - Nothing
     */
    public async start(
    ): Promise<void> {

        // -- Don't start the server if it's already started
        if (this._started) {
            Log.warn('Server already started!');
            return Promise.resolve();
        };
        
        // -- Start the server
        this._started = true;
        Log.info('Starting server...');
        this._append_middleware(this._middleware);
        
        
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
     * @name _append_middleware
     * Appends the middleware to every route
     */
    private _append_middleware = (
        middleware: Middleware
    ): void => {
        Log.debug('Appending middleware to all routes...');

        // -- Loop through all the routes
        for (const route of this._routes.values())
            Object.keys(middleware).forEach(key => route.add_middleware(key, middleware[key]));

        Log.debug('Middleware appended to all routes');
    };




    /**
     * @name add_route
     * Adds a route to the server
     *
     * @param {Route} route - The route to add
     *
     * @returns {void} - Nothing
     */
    public add_route(route: Route<any, Middleware>): void {

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



    public get configuration(): ServerConfiguration<Middleware> { return this._configuration; }
    public get port(): number { return this._configuration.port; }
    public get host(): string { return this._configuration.host; }
    public get started(): boolean { return this._started; }
    public get address(): string { return `${this.host}:${this.port}`; }
}