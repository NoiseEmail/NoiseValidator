import { HTTPMethods, FastifyRequest, FastifyReply } from 'fastify';
import { validate_binder_request } from '.';
import { Schemas, Cookie, BinderNamespace } from './types.d';
import { Route } from '../route';
import { validate_middlewares } from './validators';



const validate = async <
    InputRoute extends Route<any>
>(
    route: InputRoute,
    schemas: Schemas,
    request: FastifyRequest,
    reply: FastifyReply,
    configuration: BinderNamespace.GenericOptionalConfiguration
): Promise<BinderNamespace.GenericCallbackObject> => {

    // -- Validate the request inputs
    const validated = await validate_binder_request(request, schemas, route.path);
    const middleware = await validate_middlewares(request, reply, configuration.middleware);


    const remove_cookie = (name: string) => middleware.cookies.delete(name);
    const set_cookie = (name: string, cookie: Cookie.Shape) => middleware.cookies.set(name, cookie);


    // -- Return the validated data
    const response_object: BinderNamespace.GenericCallbackObject =  {
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



    return response_object;
};



export default validate;