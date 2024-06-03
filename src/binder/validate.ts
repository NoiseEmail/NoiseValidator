import { BinderNamespace, Cookie, Schemas } from './types.d';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Route } from 'noise_validator/src/route';
import { validate_binder_request } from '.';
import { Execute, GenericMiddleware } from 'noise_validator/src/middleware';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';



const validate = async <
    InputRoute extends Route<any, any>
>(
    route: InputRoute,
    schemas: Schemas,
    request: FastifyRequest,
    reply: FastifyReply,
    parsed_middleware: MiddlewareNamespace.MiddlewareObject
): Promise<BinderNamespace.ValidateDataReturn> => {

    const middleware = await Execute.many(parsed_middleware, { request, reply });
    if (!middleware.overall_success) return { ...middleware, success: false };
    const validated = await validate_binder_request(request, schemas, route.path);

    // -- Return the validated data
    return {
        middleware: middleware.data,
        body: validated.body,
        query: validated.query,
        headers: validated.headers,
        cookies: validated.cookies,
        url: validated.url,
        fastify: { request, reply },
        set_cookie: (name: string, cookie: Cookie.Shape) => middleware.cookies.set(name, cookie),
        remove_cookie: (name: string) => middleware.cookies.delete(name),

        middleware_cookies: middleware.cookies,
        middleware_headers: middleware.headers,
        success: true,
    };
};



export default validate;