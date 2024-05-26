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
    Array<SchemaNamespace.SchemaLike<'body'>>,
    Array<SchemaNamespace.SchemaLike<'query'>>,
    Array<SchemaNamespace.SchemaLike<'headers'>>,
    Array<SchemaNamespace.SchemaLike<'cookies'>>,
    Array<SchemaNamespace.SchemaLike<'body'>>,
    Array<SchemaNamespace.SchemaLike<'headers'>>
>;