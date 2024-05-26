import { Middleware } from "../middleware/types";
import { BinderNamespace } from "./types.d";
import { SchemaNamespace } from "../schema/types.d";



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
    Middleware.MiddlewareObject,
    Array<SchemaNamespace.NestedSchemaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>,
    Array<SchemaNamespace.NestedSchemaLike>,
    Array<SchemaNamespace.FlatSchmeaLike>
>;