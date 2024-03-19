import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { BinderCallbackObject, OptionalBinderConfiguration } from "./types";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'> | Array<Schema.SchemaLike<'body'>>,
    Query extends Schema.SchemaLike<'query'> | Array<Schema.SchemaLike<'query'>>,
    Headers extends Schema.SchemaLike<'headers'> | Array<Schema.SchemaLike<'headers'>>,
    
    CallbackObject = BinderCallbackObject<
        Middleware,
        Body,
        Query,
        Headers
    >
>(
    configuration: OptionalBinderConfiguration<
        Middleware,
        Body,
        Query,
        Headers
    >,
    callback: (data: CallbackObject) => void
) {
    
};