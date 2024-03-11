import { GenericError } from './error/error';
import {
    Schema,
    Number,
    Boolean,
    String,
    Optional
} from './schema'

import { Schema as SchemaTypes } from './schema/types.d';


const user_schema = new Schema.Body({
    name: String,
    age: Number,
    is_admin: Boolean,
    email: Optional(Number),
    password: Optional(String),
    other: {
        test: String,
        other_test: Number
    }
});


user_schema.validate({
    name: 'test',
    age: 12,
    is_admin: true,
    email: 'sd',
    password: 'test',
    other: {
        test: 'test',
        other_test: 12
    }
}).then((result) => {
    console.log('valid', result);

    let test = result.password
    test._return_type
}).catch((error) => {
    console.log('error', error.serialize());
});
