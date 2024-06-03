import callback from './callback';
import validate from './validate';
import { ArrayModifier, BinderNamespace, SchemaOutput, Schemas } from './types.d';
import { DefaultBinderConfiguration } from './';
import { HTTPMethods } from 'fastify';
import { mergician } from 'mergician';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { Route } from 'noise_validator/src/route';
import { SchemaNamespace } from 'noise_validator/src/schema/types';
import { GenericMiddleware } from 'noise_validator/src/middleware';



export default function Binder<
    // -- Input types
    Middleware              extends MiddlewareNamespace.MiddlewareObject,
    ExternalMiddleware      extends MiddlewareNamespace.MiddlewareObject,
    RouterMiddleware        extends MiddlewareNamespace.MiddlewareObject,
    DynamicURLInputSchema   extends string,
    BodyInputSchema         extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    QueryInputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    HeadersInputSchema      extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,
    CookieInputSchema       extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,

    // -- Output types
    BodyOutputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>,
    HeadersOutputSchema     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>,

    // -- Callback types
    BinderCallbackReturn    extends SchemaOutput.Types<BodyOutputSchema, HeadersOutputSchema>,
    CombinedMiddleware      extends RouterMiddleware & ExternalMiddleware & Middleware,
    CallbackObject          extends BinderNamespace.CallbackObject<CombinedMiddleware, BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>,
>(
    route: Route<DynamicURLInputSchema, ExternalMiddleware, RouterMiddleware>,
    method: HTTPMethods,
    configuration: BinderNamespace.OptionalConfiguration<Middleware, BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, BodyOutputSchema, HeadersOutputSchema>,
    binder_callback: (data: CallbackObject) => BinderCallbackReturn | Promise<BinderCallbackReturn>
): void {
    

    // -- Ensure that all the schemas are arrays, even if they are empty
    const schemas: Schemas = {
        input: {
            body: make_array(configuration.schemas?.input?.body),
            query: make_array(configuration.schemas?.input?.query),
            headers: make_array(configuration.schemas?.input?.headers),
            cookies: make_array(configuration.schemas?.input?.cookies)
        },
        
        output: {
            body: make_array(configuration.schemas?.output?.body),
            headers: make_array(configuration.schemas?.output?.headers)
        }
    };  

    // -- Extract the middleware from the configuration
    const split_middleware = GenericMiddleware.split_runtime_object(configuration.middleware);
    
    // -- Merge the default configuration with the user configuration
    configuration = mergician(DefaultBinderConfiguration, configuration);
    route.add_binder({
        callback: async (data) => callback(binder_callback, data, route, schemas),
        validate: async (request, reply, middleware) => validate(route, schemas, request, reply, middleware),
        method,
        before_middleware: split_middleware.before,
        after_middleware: split_middleware.after,
    });
}



const make_array = <T extends unknown>(value: T | Array<T> | undefined): Array<T> => {
    if (typeof value === 'undefined') return [];
    return Array.isArray(value) ? value : [value];
}



export {
    Binder,
    make_array
}