import { GenericError } from "../error/types";

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
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown
    > = new (
        input_value: unknown,
        on_invalid: (error: GenericError.GenericErrorLike) => void,
        on_valid: (result: ReturnType) => void
    ) => GenericTypeLike<ReturnType>;
}