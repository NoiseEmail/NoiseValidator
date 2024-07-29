// import * as nv from './src';



// const testschema3 = new nv.Schema({
//     data: nv.Number,
// });

// const server = new nv.Server({
//     port: 8080,
// });

// const route = new nv.Route(server, '/contacts/email/check');

// nv.Binder(route, 'POST', {
//     schemas: { input: { body: testschema3 } }
// }, async () => {
//     console.log(1)
// });

// const test2 = nv.register_api_route('localhost:8080', '/contacts/email/check', 'POST', {
//     input: { body: testschema3 },
//     intercept: (r) => { }
// });

// await server.start()


// const data = await test2({
//     body: {
//         data: 1
//     },

// })

// console.log(data.error.message)
