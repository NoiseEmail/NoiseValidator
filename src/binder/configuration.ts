import { Middleware } from "../middleware/types";
import { BinderConfiguration } from "./types.d";
import { Schema } from "../schema/types.d";



export default {
    method: 'GET',
    middleware: {},
    schemas: {
        body: [],
        query: [],
        headers: [],
        output: []
    }
} as BinderConfiguration<
    Middleware.MiddlewareObject,
    Array<Schema.SchemaLike<'body'>>,
    Array<Schema.SchemaLike<'query'>>,
    Array<Schema.SchemaLike<'headers'>>,
    Array<Schema.SchemaLike<'body'>>
>;