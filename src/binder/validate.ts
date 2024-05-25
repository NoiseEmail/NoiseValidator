import { HTTPMethods, FastifyRequest, FastifyReply } from 'fastify';
import { validate_binder_request } from '.';
import { Schemas, Cookie, BinderNamespace } from './types.d';
import { Route } from '../route';
import { GenericError } from '../error';
import { Log } from '..';
import { validate_middlewares } from './validators';



const validate = async <
    InputRoute extends Route<any>
>(
    route: InputRoute,
    method: HTTPMethods,
    schemas: Schemas,
    request: FastifyRequest,
    reply: FastifyReply,
    configuration: BinderNamespace.GenericConfiguration
) => {

    // -- Validate the request inputs
    Log.debug(`Validating request for ${route.path} with method: ${method}`);
    const validated = await validate_binder_request(request, schemas, route.path);
    if (validated instanceof GenericError) throw validated;

    // -- Validate the middleware
    Log.debug(`Validating middleware for ${route.path} with method: ${method}`);
    const middleware = await validate_middlewares(request, reply, configuration.middleware);
    if (middleware instanceof GenericError) throw middleware;


    const remove_cookie = (name: string) => middleware.cookies.delete(name);
    const set_cookie = (name: string, cookie: Cookie.Shape) => middleware.cookies.set(name, cookie);


    // -- Return the validated data
    return {
        middleware: middleware.middleware,
        cookie_objects: middleware.cookies,
        body: validated.body,
        query: validated.query,
        headers: validated.headers,
        cookies: validated.cookies,
        url: validated.url,
        fastify: { request, reply },
        set_cookie: (name: string, cookie: Cookie.Shape) => { set_cookie(name, cookie); },
        remove_cookie: (name: string) =>{ remove_cookie(name); }
        
    };
};



export default validate;