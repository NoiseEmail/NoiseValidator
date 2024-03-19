import {
    Binder,
    GenericMiddleware,
    Schema,
    Uuid,
    Number,
    String,
    Optional
} from 'gs';
import { Middleware } from './middleware/types';



class Test1Middleware extends GenericMiddleware<{
    a: string
}> {
    
};

class Test2Middleware extends GenericMiddleware<{
    b: string
}> {
    
};



const body_1_schema = new Schema.Body({
    a: String,
    b: Number,
    c: Optional(Uuid)
});


Binder({
    middleware: {
        test: Test1Middleware,
        test2: Test2Middleware
    },
    schemas: {
        body: body_1_schema
    }
}, (data) => {
    data.middleware.test.a;

    data.body.a;
});