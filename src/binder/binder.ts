import { HTTPMethods } from 'fastify';
import { DefaultBinderConfiguration } from '.';
import { Middleware } from '../middleware/types.d';
import { SchemaNamespace } from '../schema/types.d';
import { SchemaOutput, BinderNamespace, Schemas, ArrayModifier } from './types.d';
import { mergician } from 'mergician';
import { Route } from '../route';

import validate from './validate';
import callback from './callback';



export default function Binder<
    // -- Input types
    Middleware              extends Middleware.MiddlewareObject,
    DynamicURLInputSchema   extends string,
    BodyInputSchema         extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,
    QueryInputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,
    HeadersInputSchema      extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,
    CookieInputSchema       extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,

    // -- Output types
    BodyOutputSchema        extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,
    HeadersOutputSchema     extends ArrayModifier.ArrayOrSingle<SchemaNamespace.SchemaLike>,

    // -- Callback types
    BinderCallbackReturn extends SchemaOutput.Types<BodyOutputSchema, HeadersOutputSchema>,
    CallbackObject extends BinderNamespace.CallbackObject<Middleware, BodyInputSchema, QueryInputSchema, HeadersInputSchema, CookieInputSchema, DynamicURLInputSchema>,
>(
    route: Route<DynamicURLInputSchema>,
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



    // -- Merge the default configuration with the user configuration
    configuration = mergician(DefaultBinderConfiguration, configuration);
    route.add_binder({
        callback: async (data) => callback(binder_callback, data, route, schemas),
        validate: async (request, reply) => validate(route, schemas, request, reply, configuration),
        method
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