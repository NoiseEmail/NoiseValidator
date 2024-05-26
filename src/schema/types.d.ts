import { GenericError } from '../error';
import { LogFunctions, LogObject } from '../logger/types';



export namespace SchemaNamespace {

    export class GenericTypeLike<
        ReturnType extends unknown = unknown,
        InputShape extends unknown = unknown
    > {        
        _return_type: ReturnType;
        _input_shape: InputShape;

        public constructor(
            _input_value: unknown,
            _on_invalid: (error: GenericError) => void,
            _on_valid: (result: ReturnType) => void
        );

        protected _input_value: unknown;
        protected _on_invalid: (error: GenericError) => void;
        protected _on_valid: (result: ReturnType) => void;

        protected handler: (
            input_value: unknown,
            invalid: (error: GenericError) => void,
            valid: (result: ReturnType) => void
        ) => 
            (ReturnType | Promise<ReturnType>) |
            (Promise<GenericError> | GenericError);

        protected invalid: (error: GenericError | string) => GenericError;
        protected valid: (result: ReturnType) => ReturnType;
        public execute: () => Promise<void>;

        public static get name(): string;
        public log: LogFunctions;
        public get log_stack(): Array<LogObject>;
    }



    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown,
        InputShape extends unknown = unknown
    > = new (
        input_value: unknown,
        on_invalid: (error: GenericError) => void,
        on_valid: (result: ReturnType) => void,
        validated?: ReturnType
    ) => GenericTypeLike<ReturnType, InputShape>;

    export type InputSchema = {
        [key: string]: GenericTypeConstructor<any> | InputSchema;
    }

    export type FlatSchema = {
        [key: string]: GenericTypeConstructor<any> ;
    };


    
    /**
     * Simple type that checks if an object contains other
     * objects, eg { key: { key: 'value' } }
     */
    export type ObjectIsNested<T> = {
        [K in keyof T]: T[K] extends object ? true : false;
    } extends { [key: string]: true } ? true : false;



    

    export class SchemaLike<
        ReturnableData = ParsedSchema<InputSchema>
    > {
        public readonly _return_type: ReturnableData;
        public readonly _id: string;
        public readonly _schema: InputSchema | FlatSchema;
        private constructor(schema: InputSchema);
        public validate: (data: unknown) => Promise<ReturnableData>;
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


    type ExtractOptional<T> = {
        [K in keyof T as Exclude<T[K], undefined> extends never ? never : K]: T[K] extends object
          ? ExtractOptional<T[K]>
          : T[K];
      };
      
    export type OptionalParsedSchema<
        Schema 
    > = ExtractOptional<Schema>;


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



    /**
     * Gets any schemas return type
     */
    export type ReturnType<T extends SchemaLike> = 
        T extends { _return_type: infer R } ? R : never;
}