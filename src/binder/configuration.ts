import { Middleware } from "../middleware/types";
import { OptionalBinderConfiguration } from "./types.d";
import { Schema } from "../schema/types.d";



export default {
    method: 'GET',
    middleware: {},
    schemas: {
        input: {
            body: [],
            query: [],
            headers: []
        },
        output: {
            body: [],
            headers: []
        }
    }
} as OptionalBinderConfiguration<
    Middleware.MiddlewareObject,
    Array<Schema.SchemaLike<'body'>>,
    Array<Schema.SchemaLike<'query'>>,
    Array<Schema.SchemaLike<'headers'>>,

    Array<Schema.SchemaLike<'body'>>,
    Array<Schema.SchemaLike<'headers'>>
>;