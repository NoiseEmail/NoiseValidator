import {
    execute,
    GenericType,
    MissingHandlerError,
    Schema,
    Number,
    Boolean,
    String
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
    id: Number,
    admin: Boolean.config(true),
    custom: CustomType,
    test: {
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
    id: 123,
    admin: true,
    custom: 'input',
    test: {
        a: 'test',
        b: 'fart'
    }
}).then((result) => {
    if (result instanceof Error) console.log('Invalid', result.message);
    else console.log('valid', result);
})