import { ArrayModifier, ObjectModifier } from 'noise_validator/src/binder/types';
import { SchemaNamespace } from 'noise_validator/src/schema/types';

export namespace DynamicURL {

    export type StartsWithColon<str extends string> =
        str extends `:${infer _}` ? true : false;

    export type RemoveStartingColons<str extends string> =
        StartsWithColon<str> extends true ?
        str extends `:${infer right}` ? RemoveStartingColons<right> :
        str : str;

    export type HasColonLeft<str extends string> =
        str extends `${infer _}:${infer __}` ? true : false;

    // -- Regex params look like this :param(regex)whatever
    //    So we need to remove the regex part and everything after it
    //    so were left with :param
    export type RemoveRegex<str extends string> =
        str extends `${infer left}(${infer _})${infer __}`
        ? left
        : str;

    export type Extract<str extends string, res extends Array<string> = []> =
        HasColonLeft<str> extends false ? res :
        str extends `${infer l}:${infer r}` ?
        HasColonLeft<r> extends false ? [
            ...res, 
            StripTrailingSlash<RemoveRegex<r>>
        ] :
        StartsWithColon<r> extends true ? Extract<RemoveStartingColons<r>, res> :
        r extends `${infer l2}:${infer r2}` ? Extract<`:${r2}`, [
            ...res, 
            StripTrailingSlash<RemoveRegex<l2>>
        ]> :
        never : never;

    export type ArrayToObject<Arr extends Array<string>> = {
        [Key in Arr[number]]: string;
    }

    export type StripTrailingSlash<str extends string> =
        str extends `${infer left}/${infer _}` ? StripTrailingSlash<left> :
        str;

    export type Extracted<str extends string> = ArrayToObject<Extract<str>>;
}

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