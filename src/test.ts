import {
    Binder,
    GenericMiddleware,
    Schema,
    Uuid,
    Number,
    String,
    Optional,
    Router,
    Route
} from 'gs';



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

const body_2_schema = new Schema.Body({
    a: String,
    b: Number,
    c: Uuid
});



const query_1_schema = new Schema.Query({
    a: String,
    b: Number,
    c: Optional(Uuid)
});

const query_2_schema = new Schema.Query({
    a: String,
    b: Number,
    c: Uuid
});


Router.instance.start({ debug: true });
const basic_route = new Route('/basic', { friendly_name: 'Basic Route' });


Binder(basic_route, 'GET', {
    middleware: {
        test: Test1Middleware,
        test2: Test2Middleware
    },
    schemas: {
        body: body_1_schema,
        query: query_1_schema,
        output: body_1_schema,
    }
}, (data) => {
    data.middleware.test.a;

    data.body.a;
    // data.url.id;

    return {
        a: 'a',
        b: 1,
        c: 'c'
    }
});
