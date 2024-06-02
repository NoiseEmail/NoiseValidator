import { BinderFailedToExecuteError } from '.';
import { BinderNamespace, BinderOutputValidatorResult, Cookie, Schemas } from './types.d';
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
): Promise<BinderOutputValidatorResult> => {
    try {
        const result = await callback(data);
        return validate_binder_output(result, schemas, route.path);
    }

    catch (unknown_error) { 
        throw GenericError.from_unknown(
            unknown_error, 
            new BinderFailedToExecuteError('Unknown error occurred in binder callback')
        );
    }
};



export default callback;