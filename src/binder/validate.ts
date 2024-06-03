import { BinderNamespace, Cookie, Schemas } from './types.d';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Route } from 'noise_validator/src/route';
import { validate_binder_request } from '.';
import { Execute, GenericMiddleware } from 'noise_validator/src/middleware';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { RequestProcessor } from 'noise_validator/src/route';



const validate = async <
    InputRoute extends Route<any, any>
>(
    route: InputRoute,
    schemas: Schemas,
    request: FastifyRequest,
    reply: FastifyReply,
    parsed_middleware: MiddlewareNamespace.MiddlewareObject,
    request_processor: RequestProcessor
): Promise<BinderNamespace.ValidateDataReturn> => {
    const cookies = new Map<string, Cookie.Shape>();
    const middleware = await Execute.many(parsed_middleware, { request, reply }, request_processor);
    const middleware_return = {
        on_both_cookies: middleware.on_both_cookies,
        on_both_headers: middleware.on_both_headers,
        on_failure_cookies: middleware.on_failure_cookies,
        on_failure_headers: middleware.on_failure_headers,
        on_success_cookies: middleware.on_success_cookies,
        on_success_headers: middleware.on_success_headers,
        binder_set_cookies: cookies,
    }
    
    if (!middleware.overall_success) return { ...middleware, ...middleware_return, success: false };
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
        set_cookie: (name: string, cookie: Cookie.Shape) => cookies.set(name, cookie),
        remove_cookie: (name: string) => cookies.delete(name),

        ...middleware_return,
        data: middleware.data,
        success: true,
    };
};



export default validate;