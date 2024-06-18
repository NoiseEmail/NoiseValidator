import * as nv from './src';


const testschema = new nv.Schema({
    a: nv.String,
    c: {
        balls: nv.String
    }
});


const testschema2 = new nv.Schema({
    a: nv.String,
    b: testschema
});



console.log(await testschema2.validate({ a: '', b: { a: 'sdfsd', c:{o:'ck'} }}))

// class MiddlewareExecutionError extends nv.GenericError {
//     public constructor(
//         message: string
//     ) {
//         super(message, 500);
//     }
// }



const server = new nv.Server();
const route = new nv.Route(server, '/contacts/email/check/:code');

// class MW extends nv.GenericMiddleware {
//     protected handler = async () => {
//         console.log('Middleware executed');
//         return { 'a': 'test' }
//     }
// }



nv.Binder(route, 'GET', {

    schemas: {
        input: {
            body: [testschema2]
        }
    }
}, async ({
    middleware,
    url,
    body
}) => {
    console.log(body.b.c.balls);
});




// server.start();



// const test = nv.register_api_route('localhost:8080', 'contacts/email/check/:code', 'GET', {
//     input: {
//         query: [testschema]
//     }
// });

// const res = await test({
//     route: {
//         code: '1'
//     },
//     query: {
//         a: 'test'
//     }
// })

// // console.log(res.success, res.error.message);

