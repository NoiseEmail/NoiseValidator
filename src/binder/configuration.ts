import { Middleware } from "../middleware/types";
import { BinderNamespace } from "./types.d";
import { Schema } from "../schema/types.d";



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
    Array<Schema.SchemaLike<'body'>>,
    Array<Schema.SchemaLike<'query'>>,
    Array<Schema.SchemaLike<'headers'>>,
    Array<Schema.SchemaLike<'cookies'>>,
    Array<Schema.SchemaLike<'body'>>,
    Array<Schema.SchemaLike<'headers'>>
>;