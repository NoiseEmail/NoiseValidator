import { GenericError } from './error/error';
import {
    execute,
    GenericType,
    MissingHandlerError,
    Schema,
    Number,
    Boolean,
    String,
    Optional
} from './schema'

import { Schema as SchemaTypes } from './schema/types.d';
class CustomType extends GenericType<{
    test: string
}> {

 
    protected handler = () => {
        
        return {
            test: 'test'
        };
    }
}


const user_schema = new Schema.Body({
    name: String,
    id: Optional(Number),
    admin: Boolean.config(true),
    a: {
        a: String,
        b: Optional(Number)
    }
});


user_schema.validate({
    name: 'test',
    id: 1,
    admin: true,
    a: {
        a: 'test'
    },
    balls: 5
}).then((result) => {
    if (result instanceof GenericError) console.log('Invalid', result.serialize());
    else console.log('valid', result);
})