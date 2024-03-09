import { randomUUID } from 'crypto';
import { Schema as SchemaTypes } from './types.d';


export default class Schema<
    ValidatedReturnable extends unknown
> { 
    private readonly _id: string = randomUUID();
    private readonly _schema: SchemaTypes.InputSchema;

    public constructor(
        schema: SchemaTypes.InputSchema
    ) {
        this._schema = schema;
    };

    
};