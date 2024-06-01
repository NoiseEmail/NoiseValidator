import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';

export type ServerConfiguration<
    Middleware extends MiddlewareNamespace.MiddlewareObject,
> = {
    port: number;
    debug: boolean;
    host: string;
    https: { 
        key: string, 
        cert: string 
    },
    middleware: Middleware;
};

export type OptionalServerConfiguration<
    Middleware extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject
> = Partial<ServerConfiguration<Middleware>>;