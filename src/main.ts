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


(async () => {
    const result = await user_schema.validate({
        name: 'test',
        age: 12,
        is_admin: true,
        email: 1,
        password: 'test',
        other: {
            other_test: 12
        }
    }).then((result) => console.log()).catch((error) => { })
    

    console.log(user_schema.serialized_errors);
})();
