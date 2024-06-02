import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';

export type ServerConfiguration<
    MiddlewareBefore extends MiddlewareNamespace.MiddlewareObject,
    MiddlewareAfter extends MiddlewareNamespace.MiddlewareObject
> = {
    port: number;
    debug: boolean;
    host: string;
    https: { 
        key: string, 
        cert: string 
    },
    middleware: {
        before?: MiddlewareBefore,
        after?: MiddlewareAfter
    } | MiddlewareBefore;
};

export type OptionalServerConfiguration<
    MiddlewareBefore extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject,
    MiddlewareAfter extends MiddlewareNamespace.MiddlewareObject = MiddlewareNamespace.MiddlewareObject
> = Partial<ServerConfiguration<MiddlewareBefore, MiddlewareAfter>>;