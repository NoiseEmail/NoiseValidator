import Fastify, { FastifyInstance } from 'fastify';
import Log from 'noise_validator/src/logger';
import { DefualtServerConfiguration } from '.';
import { OptionalServerConfiguration, ServerConfiguration } from './types.d';
import { Route } from 'noise_validator/src/route';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { GenericMiddleware } from 'noise_validator/src/middleware';



export default class Server<
    BeforeMiddleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject,
    AfterMiddleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject,
> {

    private _routes: Map<String, Route<any, BeforeMiddleware>>;
    private _server: FastifyInstance;
    private _before_middleware: MiddlewareNamespace.MiddlewareObject;
    private _after_middleware: MiddlewareNamespace.MiddlewareObject;
    private _configuration: ServerConfiguration<BeforeMiddleware, AfterMiddleware>;
    private _started: boolean = false;

    public constructor(
        configuration: OptionalServerConfiguration<BeforeMiddleware> = {}
    ) {
        Log.info('Creating rerver...');
        this._routes = new Map();
        this._configuration = Server.build_configuration<BeforeMiddleware, AfterMiddleware>(configuration);
        this._server = Fastify({ logger: false, bodyLimit: this._configuration.body_limit });

        // -- Split the middleware object
        const split_middleware = GenericMiddleware.split_runtime_object(configuration?.middleware);
        this._before_middleware = split_middleware.before;
        this._after_middleware = split_middleware.after;
    }




    public static build_configuration = <
        BMO extends MiddlewareNamespace.MiddlewareObject,
        AMO extends MiddlewareNamespace.MiddlewareObject
    >(configuration: ServerConfiguration<BMO, AMO> | {}): ServerConfiguration<BMO, AMO> => {
        return { ...DefualtServerConfiguration, ...configuration } as ServerConfiguration<BMO, AMO>;
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
        this._compile_binders();
        
        
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
     * @name _compile_binders
     * Appends the middleware to every route
     */
    private _compile_binders = (): void => {
        for (const route of this._routes.values()) {

            // -- Add the middleware
            Object.keys(this._before_middleware || {}).forEach(key => 
                route.add_middleware(key, this._before_middleware[key], MiddlewareNamespace.MiddlewareRuntime.BEFORE));

            Object.keys(this._after_middleware || {}).forEach(key => 
                route.add_middleware(key, this._after_middleware[key], MiddlewareNamespace.MiddlewareRuntime.AFTER));

            // -- Compile the binder
            route._compile_binder();
        }
    };



    /**
     * @name add_route
     * Adds a route to the server
     *
     * @param {Route} route - The route to add
     *
     * @returns {void} - Nothing
     */
    public add_route(route: Route<any, BeforeMiddleware>): void {

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



    public get configuration(): ServerConfiguration<BeforeMiddleware, AfterMiddleware> { return this._configuration; }
    public get port(): number { return this._configuration.port; }
    public get host(): string { return this._configuration.host; }
    public get started(): boolean { return this._started; }
    public get address(): string { return `${this.host}:${this.port}`; }
}