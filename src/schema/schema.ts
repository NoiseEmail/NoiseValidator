import { randomUUID } from 'crypto';
import { Schema as SchemaTypes } from './types.d';


export default class Schema<
    ValidatedReturnable extends unknown,
    InputSchema extends SchemaTypes.InputSchema
> { 
    private readonly _id: string = randomUUID();
    private readonly _schema: InputSchema;

    public constructor(
        schema: InputSchema
    ) {
        this._schema = schema;
    };


};