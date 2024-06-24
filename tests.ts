import * as nv from './src';
const testschema3 = new nv.Schema({
    z: nv.String,
});



const testschema = new nv.Schema({
    a: nv.String,
    b: testschema3,
    c: {
        balls: nv.String
    }
});


const testschema2 = new nv.Schema({
    a: nv.Optional(testschema3, {z:'balls'}),
    b: nv.Array(nv.Boolean)
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
    console.log(body.a);
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

