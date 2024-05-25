import { HTTPMethods, FastifyRequest, FastifyReply } from "fastify";
import {
    BinderFailedToExecuteError,
    DefaultBinderConfiguration,
    validate_binder_request,
} from ".";
import { Middleware } from "../middleware/types.d";
import { Schema } from "../schema/types.d";
import {
    BinderCallbackObject,
    OptionalBinderConfiguration,
    ExtractOutputSchemaTypes,
    Schemas,
    Cookie,
    BinderConfigurationSchema,
} from "./types.d";
import { mergician } from "mergician";
import { Route } from "../route";
import { GenericError } from "../error";
import { Log } from "..";
import { validate_binder_output, validate_middlewares } from "./validators";
import { create_set_cookie_header } from "./cookie";



const validate = async <
    BinderCallbackObject, 
    InputRoute extends Route<any>
>(
    route: InputRoute,
    method: HTTPMethods,
    schemas: Schemas,
    request: FastifyRequest,
    reply: FastifyReply,
    configuration: BinderConfigurationSchema
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

        set_cookie: (name: string, cookie: Cookie.Shape) => 
            { set_cookie(name, cookie); },

        remove_cookie: (name: string) =>
            { remove_cookie(name); }
        
    } as BinderCallbackObject;
};



export default validate;