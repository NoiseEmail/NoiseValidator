import { MiddlewareNamespace } from '@middleware/types';
import { BinderNamespace } from './types.d';
import { SchemaNamespace } from '@schema/types';



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