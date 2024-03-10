import { GenericError } from '../error/types';

export namespace Schema {
    export type Returnable<T> = 
        T | 
        Promise<T> |
        GenericError.GenericErrorLike |
        Promise<GenericError.GenericErrorLike>;



    export class GenericTypeLike<
        ReturnType extends unknown = unknown
    > {
        protected constructor(
            _input_value: unknown,
            _on_invalid: (error: GenericError.GenericErrorLike) => void,
            _on_valid: (result: ReturnType) => void
        );

        protected _input_value: unknown;
        protected _on_invalid: (error: GenericError.GenericErrorLike) => void;
        protected _on_valid: (result: ReturnType) => void;

        protected handler: (
            input_value: unknown,
            invalid: (error: GenericError.GenericErrorLike) => void,
            valid: (result: ReturnType) => void
        ) => Returnable<ReturnType>;

        protected invalid: (
            error: GenericError.GenericErrorLike | string
        ) => GenericError.GenericErrorLike;
        protected valid: (result: ReturnType) => void;
        public execute: () => Promise<void>;
        protected get validated(): ReturnType;
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown
    > = new (
        input_value: unknown,
        on_invalid: (error: GenericError.GenericErrorLike) => void,
        on_valid: (result: ReturnType) => void
    ) => GenericTypeLike<ReturnType>;



    export type InputSchema = {
        // -- Recursively defined schema
        [key: string]: GenericTypeConstructor<any> | InputSchema;
    };
}



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
        HasColonLeft<r> extends false ? [...res, RemoveRegex<r>] :
        StartsWithColon<r> extends true ? Extract<RemoveStartingColons<r>, res> :
        r extends `${infer l2}:${infer r2}` ? Extract<`:${r2}`, [...res, RemoveRegex<l2>]> :
        never : never;

    export type ArrayToObject<Arr extends Array<string>> = {
        [Key in Arr[number]]: string;
    }

    export type Extracted<str extends string> = ArrayToObject<Extract<str>>;
}