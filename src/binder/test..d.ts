import { Schema } from "../schema/types";
import { ArrayModifier } from "./types";
import { GenericError } from "../error";
import { Middleware } from "../middleware/types.d";
import { DynamicURL } from "../route/types.d";
import { FastifyReply, FastifyRequest, HTTPMethods } from "fastify";




export namespace Binder {

    export type Configuration<
        BodyInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'body'>>,
        QueryInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'query'>>,
        HeadersInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'headers'>>,
        CookieInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'cookies'>>,
        BodyOutputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'body'>>,
        HeadersOutputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'headers'>>
    > = {
        input: { body: BodyInputSchema, query: QueryInputSchema, headers: HeadersInputSchema, cookies: CookieInputSchema },
        output: { body: BodyOutputSchema, headers: HeadersOutputSchema }
    };



    export type OptionalConfiguration<
        BodyInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'body'>>,
        QueryInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'query'>>,
        HeadersInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'headers'>>,
        CookieInputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'cookies'>>,
        BodyOutputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'body'>>,
        HeadersOutputSchema extends ArrayModifier.ArrayOrSingle<Schema.SchemaLike<'headers'>>
    > = {
        input?: { body?: BodyInputSchema, query?: QueryInputSchema, headers?: HeadersInputSchema, cookies?: CookieInputSchema },
        output?: { body?: BodyOutputSchema, headers?: HeadersOutputSchema }
    };



    export type GenericConfiguration = {
        input: { body: Schema.SchemaLike<'body'>, query: Schema.SchemaLike<'query'>, headers: Schema.SchemaLike<'headers'>, cookies: Schema.SchemaLike<'cookies'> },
        output: { body: Schema.SchemaLike<'body'>, headers: Schema.SchemaLike<'headers'> }
    };
}