import { GenericError } from '../error/types';
import { LogFunctions, LogObject } from '../logger/types';
import { Schema as SchemaClass } from "../schema";

export namespace Schema {

    export class GenericTypeLike<
        ReturnType extends unknown = unknown,
        InputShape extends unknown = unknown
    > {        
        _return_type: ReturnType;
        _input_shape: InputShape;

        public constructor(
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
        ) => 
            ReturnType | 
            Promise<ReturnType> |  
            Promise<GenericError.GenericErrorLike> | 
            GenericError.GenericErrorLike;

        protected invalid: (error: GenericError.GenericErrorLike | string) => GenericError.GenericErrorLike;
        protected valid: (result: ReturnType) => ReturnType;
        public execute: () => Promise<void>;

        public static get name(): string;
        public log: LogFunctions;
        public get log_stack(): Array<LogObject>;
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown
    > = new (
        input_value: unknown,
        on_invalid: (error: GenericError.GenericErrorLike) => void,
        on_valid: (result: ReturnType) => void,
        validated?: ReturnType
    ) => GenericTypeLike<ReturnType>



    export type InputSchema = {
        [key: string]: GenericTypeConstructor<any> | InputSchema;
    }

    export type FlatSchema = {
        [key: string]: GenericTypeConstructor<any> ;
    };



    export type SchemaType = 'body' | 'query' | 'headers' | 'cookies';
    
    export type SchemaValidateReturnable<ReturnableData> = Promise<{
        type: 'error';
        error: GenericError.GenericErrorLike;
    } | {
        type: 'data';
        data: ReturnableData;
    }>

    export class SchemaLike<
        InputType extends SchemaType,
        ReturnableData = ParsedSchema<InputSchema>
    > {
        public readonly _type: InputType;
        public readonly _return_type: ReturnableData;
        public readonly _id: string;
        public readonly _schema: InputSchema | FlatSchema;
        private constructor(schema: InputSchema);
        public validate: (
            data: object
        ) => SchemaValidateReturnable<ReturnableData>;
    }        



    // -- Sample input 'typeof Whatever;' eg 'InstanceType<Paramater>['_validated'];'
    export type ExtractParamaterReturnType<Paramater extends GenericTypeConstructor<any>> =
        InstanceType<Paramater>['_return_type'];

    export type ExtractParamaterInputShape<Paramater extends GenericTypeConstructor<any>> =
        InstanceType<Paramater>['_input_shape'];



    /**
     * @name ParsedSchema
     * @description Given a `InputSchema` or `FlatSchema` type, it will return a new type
     * that fits the same structure but with the `GenericTypeConstructor` replaced with
     * the return type of the validator used for that key.
     * 
     * @example
     * type ReturnType = {
     *    key1: typeof String, // Return string
     *    key2: typeof User,   // Return User { id: string, name: string }
     * };
     * 
     * type ParsedReturnType = ParsedSchema<ReturnType>;
     * ParsedReturnType = {
     *   key1: string,  
     *   key2: { id: string, name: string }
     * }
     */
    export type ParsedSchema<Schema extends InputSchema | FlatSchema> = {
        [K in keyof Schema]: 
            // -- Run it trough the ExtractParamaterReturnType to get the return type
            Schema[K] extends GenericTypeConstructor<any>
                ? ExtractParamaterReturnType<Schema[K]>
            
            : Schema[K] extends InputSchema
                ? ParsedSchema<Schema[K]>
            
            : never;
    };



    /**
     * @name ParsedInputSchema
     * @description Given a `InputSchema` or `FlatSchema` type, it will return a new type
     * that fits the same structure but with the `GenericTypeConstructor` replaced with
     * the desired input shape for that key.
     * 
     * This will be used later on to create a client side validation schema for the
     * frontend, so we can validate the input before sending it to the server.
     */
    export type ParsedInputSchema<Schema extends InputSchema | FlatSchema> = {
        [K in keyof Schema]: 
            Schema[K] extends GenericTypeConstructor<any>
                ? ExtractParamaterInputShape<Schema[K]>
            
            : Schema[K] extends InputSchema
                ? ParsedSchema<Schema[K]>
            
            : never;
    };        


}