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
): Promise<BinderNamespace.ValidateDataReturn> => {

    const middleware = await Execute.many(configuration.middleware || {}, { request, reply });
    if (!middleware.overall_success) return { ...middleware, success: false };
    const validated = await validate_binder_request(request, schemas, route.path);

    // -- Return the validated data
    return {
        middleware: middleware.data,
        cookie_objects: middleware.cookies,
        body: validated.body,
        query: validated.query,
        headers: validated.headers,
        cookies: validated.cookies,
        url: validated.url,
        fastify: { request, reply },
        set_cookie: (name: string, cookie: Cookie.Shape) => middleware.cookies.set(name, cookie),
        remove_cookie: (name: string) => middleware.cookies.delete(name),
        success: true
    };
};



export default validate;