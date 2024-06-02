import { ServerConfiguration } from './types.d';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';



export default {
    port: 8080,
    debug: false,
    host: 'localhost',
} as ServerConfiguration<
    MiddlewareNamespace.MiddlewareObject, 
    MiddlewareNamespace.MiddlewareObject
>;