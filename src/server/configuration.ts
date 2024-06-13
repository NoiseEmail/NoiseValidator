import { ServerConfiguration } from './types.d';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';



export default {
    port: 8080,
    debug: false,
    host: 'localhost',
    body_limit: 1048576 * 2
} as ServerConfiguration<
    MiddlewareNamespace.MiddlewareObject, 
    MiddlewareNamespace.MiddlewareObject
>;