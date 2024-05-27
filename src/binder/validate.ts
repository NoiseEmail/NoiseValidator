import { BinderNamespace, Cookie, Schemas } from './types.d';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Route } from '@route';
import { validate_binder_request } from '.';
import { Execute } from '@/middleware';



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
    const middleware = await Execute.many(configuration.middleware || {}, { request, reply });

    // -- Set the headers provided by the middleware
    middleware.headers.forEach((value, name) => reply.header(name, value));

    // -- Return the validated data
    return {
        middleware: Object.fromEntries(middleware.middleware),
        cookie_objects: middleware.cookies,
        body: validated.body,
        query: validated.query,
        headers: validated.headers,
        cookies: validated.cookies,
        url: validated.url,
        fastify: { request, reply },
        set_cookie: (name: string, cookie: Cookie.Shape) => middleware.cookies.set(name, cookie),
        remove_cookie: (name: string) => middleware.cookies.delete(name),
    };
};



export default validate;