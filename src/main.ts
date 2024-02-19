import Log from './logger/log';
import Router from "./router/router";
import Route from "./router/route";
import Binder from "./router/binder";


const router = Router.instance;
router.start();


// server.get('/', async (request, reply) => {
//     return { hello: 'world' };
// });

// router.add_route(Route.new({
//     path: ['test'],
//     friendly_name: 'Test'
// }));

const route = Route.new({
    path: ['test'],
    friendly_name: 'Test'
});

//
// const basic = route.bind({
//     method: 'GET',
//
//     required_headers: {
//         'test': true,
//         'test2': false,
//         'a': true
//     },
//
//     required_query: {
//         'test': 'string',
//         'test2': 'Optional<string>',
//         'a': {
//             'test': 'number',
//             'test2': 'Optional<number>',
//             'custom': (value, reject): boolean => {
//                 return true;
//             }
//         }
//     },
//
//     handler(request) {
//         const a = request.body.ddddd;
//         request.headers.test2;
//         Log.info(a);
//     }
// })
//
//
// route.bind(basic);
// route.bind({
//     method: 'GET',
//     required_headers: { 'test': true },
//     handler(request) {
//         Log.info(request.headers.test);
//     }
// })

const basic_bind = new Binder(
    'GET',
    (request) => {
        Log.info(request.body.balls);
    },
    {
        balls: (value, reject):boolean => { return true; }
    },
    {},
    {}
);

route.bind(basic_bind);


const other_bind = Binder.new({
    method: 'GET',
    handler(request) {
        Log.info(request.body.balls);
    },
});