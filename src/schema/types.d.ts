import { GenericError } from 'noise_validator/src/error';



export namespace SchemaNamespace {

    export class GenericTypeLike<
        ReturnType extends unknown = unknown,
        InputShape extends unknown = unknown
    > {        
        _return_type: ReturnType;
        _input_shape: InputShape;
        public constructor(_input_value: unknown);
        protected _input_value: unknown;
        protected handler: (input_value: unknown) => Promise<ReturnType>;
        public execute: () => Promise<{ data: ReturnType, success: true } | { data: GenericError, success: false }>;
        public static get name(): string;
    }

    export type GenericTypeConstructor<
        ReturnType extends unknown = unknown,
        InputShape extends unknown = unknown
    > = new (input_value: unknown, validated?: ReturnType) => GenericTypeLike<ReturnType, InputShape>;


    export type NestedSchema = {
        [key: string]: GenericTypeConstructor<any> | NestedSchema;
    }

    export type FlatSchema = {
        [key: string]: GenericTypeConstructor<any> ;
    };

    

    export class SchemaLike<
        ReturnableData = ParsedSchema<NestedSchema | FlatSchema>
    > {
        public readonly _return_type: ReturnableData;
        public readonly _id: string;
        public readonly _schema: NestedSchema | FlatSchema;
        private constructor(schema: NestedSchema);
        public validate: (data: unknown) => Promise<ReturnableData>;
    }

    export class FlatSchmeaLike<
        ReturnableData = ParsedSchema<NestedSchema | FlatSchema>
    > {
        public readonly _return_type: ReturnableData;
        public readonly _id: string;
        public readonly _schema: FlatSchema;
        private constructor(schema: FlatSchema);
        public validate: (data: unknown) => Promise<ReturnableData>;
    }

    export class NestedSchemaLike<
        ReturnableData = ParsedSchema<NestedSchema | FlatSchema>
    > {
        public readonly _return_type: ReturnableData;
        public readonly _id: string;
        public readonly _schema: NestedSchema ;
        private constructor(schema: NestedSchema);
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
    export type ParsedSchema<Schema extends NestedSchema | FlatSchema> = {
        [K in keyof Schema]: 
            // -- Run it trough the ExtractParamaterReturnType to get the return type
            Schema[K] extends GenericTypeConstructor<any>
                ? ExtractParamaterReturnType<Schema[K]>
            
            : Schema[K] extends NestedSchema
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
    export type ParsedInputSchema<Schema extends NestedSchema | FlatSchema> = {
        [K in keyof Schema]: 
            Schema[K] extends GenericTypeConstructor<any>
                ? ExtractParamaterInputShape<Schema[K]>
            
            : Schema[K] extends NestedSchema
                ? ParsedSchema<Schema[K]>
            
            : never;
    };        



    /**
     * Gets any schemas return type
     */
    export type ReturnType<T extends SchemaLike> = 
        T extends { _return_type: infer R } ? R : never;
}