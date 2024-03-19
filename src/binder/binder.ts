import { Middleware } from "../middleware/types";
import { Schema } from "../schema/types";
import { BinderCallbackObject, BinderConfiguration, OptionalBinderConfiguration } from "./types";

export default function Binder<
    Middleware extends Middleware.MiddlewareObject,

    Body extends Schema.SchemaLike<'body'>,
    Query extends Schema.SchemaLike<'query'>,
    Params extends Schema.SchemaLike<'query'>,

    CallbackObject = BinderCallbackObject<
        Middleware,
        Body,
        Query,
        Params
    >
>(
    configuration: OptionalBinderConfiguration<
        Middleware,
        Body,
        Query,
        Params
    >,
    callback: (data: CallbackObject) => void
) {
    
};