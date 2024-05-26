import { BinderNamespace, Schemas } from './types';

import { BinderFailedToExecuteError } from '.';
import { GenericError } from '@error';
import { Route } from '@route';
import { create_set_cookie_header } from './cookie';
import { validate_binder_output } from './validators';

const callback = async (  
    callback: (data: any) => any,
    data: BinderNamespace.GenericCallbackObject,
    route: Route<any>,
    schemas: Schemas,
) => {
    try {
        const result = await callback(data);
        const output = await validate_binder_output(result, schemas, route.path);

        // -- Set the headers
        data.fastify.reply.headers(output.headers);

        // -- Set the cookies (if any)
        if (data.cookie_objects.size > 0) data.fastify.reply.header(
            'Set-Cookie', 
            create_set_cookie_header(data.cookie_objects)
        );

        // -- Send the body
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