import Log from './logger/log';
import Router from "./router/router";
import Route from "./router/route";


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


const basic = Route.Binder({
    method: 'GET',

    required_headers: {
        'test': true,
        'test2': false,
        'a': true
    },

    required_query: {
        'test': 'string',
        'test2': 'Optional<string>',
        'a': {
            'test': 'number',
            'test2': 'Optional<number>',
            'custom': (value, reject): boolean => {
                return true;
            }
        }
    },

    handler(request) {
        const a = request.body.ddddd;
        request.headers.test2;
        Log.info(a);
    }
})


route.bind(basic);
route.bind({
    method: 'GET',
    required_headers: { 'test': true },
    handler(request) {
        Log.info(request.headers.test);
    }
})