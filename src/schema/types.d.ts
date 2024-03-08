export namespace Schema {
    


    export class GenericTypeLike<
        ReturnType extends unknown = unknown
    > {
        protected constructor(
            _input_value: unknown,
            _on_invalid: () => void
        );

        protected _input_value: unknown;
        protected _on_invalid: () => void;

        protected handler: (
            input_value: unknown,
            invalid: () => void
        ) => ReturnType | Promise<ReturnType>;

        protected invalid: () => void;
        public execute: () => Promise<ReturnType | void>;
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown
    > = new (
        input_value: unknown,
        on_invalid: () => void
    ) => GenericTypeLike<ReturnType>;
}