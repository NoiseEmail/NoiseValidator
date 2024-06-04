import * as nv from './src';



class MiddlewareExecutionError extends nv.GenericError {
    public constructor(
        message: string
    ) {
        super(message, 500);
    }
}



const server = new nv.Server();
const route = new nv.Route(server, '/contacts/email/check/:code');

class MW extends nv.GenericMiddleware {
    protected handler = async () => {
        console.log('Middleware executed');
        return { 'a': 'test' }
    }
}

const testschema = new nv.Schema({
    a: nv.String
});

nv.Binder(route, 'GET', {
    middleware: {
        test: MW,
    },
    schemas: {
        input: {
            query: [testschema]
        }
    }
}, async ({
    middleware,
    url
}) => {
    console.log(url);
});




server.start();



const test = nv.register_api_route('localhost:8080', 'contacts/email/check/:code', 'GET', {
    input: {
        query: [testschema]
    }
});

const res = await test({
    route: {
        code: '1'
    },
    query: {
        a: 'test'
    }
})

// console.log(res.success, res.error.message);

