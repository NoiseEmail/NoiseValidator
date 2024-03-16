import {
    Schema,
    Number,
    Boolean,
    String,
    Optional
} from './schema';

import {
    GenericMiddleware
} from './middleware';


const user_schema = new Schema.Body({
    name: String,
    age: Number,
    is_admin: Boolean,
    email: Optional(Number),
    password: Optional(String),
    other: {
        test: Optional(String),
        other_test: Number
    }
});


(async () => {

    const start_time = process.hrtime();

    const result = await user_schema.validate({
        name: 'test',
        age: 12,
        is_admin: true,
        email: 1,
        password: 'test',
        other: {
            test: 'test',
            other_test: 12
        }
    });

    
    const end_time = process.hrtime(start_time);
  

    console.log(end_time);
})();
