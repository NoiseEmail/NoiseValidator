import { BinderFailedToExecuteError } from '.';
import { BinderNamespace, Cookie, Schemas } from './types.d';
import { create_set_cookie_header } from './cookie';
import { GenericError } from 'noise_validator/src/error';
import { Route } from 'noise_validator/src/route';
import { validate_binder_output } from './validators';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';



const callback = async (  
    callback: (data: any) => any,
    data: BinderNamespace.GenericCallbackObject,
    route: Route<any, any>,
    schemas: Schemas,
    middleware_cookies: Map<string, Cookie.Shape>,
    middleware_headers: Map<string, string>
) => {
    try {
        const result = await callback(data);
        const output = await validate_binder_output(result, schemas, route.path);
        
        data.fastify.reply.headers(output.headers);

        if (middleware_cookies.size > 0) middleware_headers.set('Set-Cookie', create_set_cookie_header(middleware_cookies));
        middleware_headers.forEach((value, key) => data.fastify.reply.header(key, value));
        
        data.fastify.reply.send(output.body);
    }

    catch (unknown_error) { 
        throw GenericError.from_unknown(
            unknown_error, 
            new BinderFailedToExecuteError('Unknown error occurred in binder callback')
        );
    }
};



export default callback;