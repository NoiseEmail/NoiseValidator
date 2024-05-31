import { BinderNamespace } from './types.d';
import { MiddlewareNamespace } from 'noise_validator/src/middleware/types';
import { SchemaNamespace } from 'noise_validator/src/schema/types';



export default {
    middleware: {},
    schemas: {
        input: {
            body: [],
            query: [],
            headers: [],
            cookies: [],
        },
        output: {
            body: [],
            headers: [],
        }
    }
} as BinderNamespace.Configuration<
    MiddlewareNamespace.MiddlewareObject,
    Array<SchemaNamespace.NestedSchemaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.NestedSchemaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>
>;