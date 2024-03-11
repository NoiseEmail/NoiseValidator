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
    custom: CustomType,
    a: {
        a: String,
        b: Number
    }
});

// type test = CustomType['validated']

// type test2 = SchemaTypes.ExtractSchemaType<typeof user_schema.schema>

// execute(
//     CustomType, 
//     'input', 
//     (error) => { console.log('Invalid', error.message); },
//     (result) => { console.log('valid', result); }
// );


user_schema.validate({
    name: 'test',
    id: 'test',
    admin: true,
    custom: 'input',
    a: {
        a: 'test',
        b: 1
    }
}).then((result) => {
    if (result instanceof GenericError) console.log('Invalid', result.serialize());
    else console.log('valid', result);
})