import { BinderFailedToExecuteError } from '.';
import { GenericError } from '../error';
import { Log, Route } from '..';
import { validate_binder_output } from './validators';
import { create_set_cookie_header } from './cookie';
import { ExtractOutputSchemaTypes, Schemas, BinderNamespace } from './types';



const callback = async <
    CallbackObject extends BinderNamespace.GenericCallbackObject,
    OutputObject extends ExtractOutputSchemaTypes,
    InputRoute extends Route<any>
>(  
    callback: (data: CallbackObject) => OutputObject | Promise<OutputObject>,
    data: CallbackObject,
    route: InputRoute,
    schemas: Schemas,
) => {
    try {
        const result = await callback(data as CallbackObject);
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