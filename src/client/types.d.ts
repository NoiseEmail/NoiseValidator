import { ArrayModifier, ObjectModifier, SchemaOutput, Schemas } from '@binder/types';
import { MiddlewareNamespace } from '@middleware/types';
import { SchemaNamespace } from '@schema/types';
import { HTTPMethods } from 'fastify';
import { DynamicURL } from '@route/types';

type IsEmpty<T> = keyof T extends never ? true : false;


export type BinderInputObject<
    Body        extends ArrayModifier.EmptyArrayToNever<ArrayModifier.ArrayOrSingle<SchemaNamespace.NestedSchemaLike>>,
    Query       extends ArrayModifier.EmptyArrayToNever<ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>>,
    Headers     extends ArrayModifier.EmptyArrayToNever<ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>>,
    Cookies     extends ArrayModifier.EmptyArrayToNever<ArrayModifier.ArrayOrSingle<SchemaNamespace.FlatSchmeaLike>>,
    URLInput    extends string,

    BodyType    = ObjectModifier.MergeSchemas<Body>,
    QueryType   = ObjectModifier.MergeSchemas<Query>,
    HeadersType = ObjectModifier.MergeSchemas<Headers>,
    CookiesType = ObjectModifier.MergeSchemas<Cookies>,
    UrlType     = DynamicURL.Extracted<URLInput>
> = 
    (IsEmpty<Body> extends true ? {} : { body: BodyType }) &
    (IsEmpty<Query> extends true ? {} : { query: QueryType }) &
    (IsEmpty<Headers> extends true ? {} : { headers: HeadersType }) &
    (IsEmpty<Cookies> extends true ? {} : { cookies: CookiesType }) &
    (IsEmpty<UrlType> extends true ? {} : { route: UrlType });