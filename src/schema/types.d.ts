export namespace Schema {
    


    export class GenericTypeLike<
        ReturnType extends unknown = unknown
    > {
        protected constructor(
            _input_value: unknown,
            _on_valid: (value: ReturnType) => void,
            _on_invalid: () => void
        );

        protected _input_value: unknown;
        protected _on_valid: (value: ReturnType) => void;
        protected _on_invalid: () => void;
        protected handler: () => ReturnType | Promise<ReturnType>;
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown
    > = new (
        input_value: unknown,
        on_valid: (value: unknown) => void,
        on_invalid: () => void
    ) => GenericTypeLike<ReturnType>;
}