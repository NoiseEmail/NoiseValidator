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
    path: '/what/:digit(^\\d+).png:balls',
    friendly_name: 'Test'
});

Binder.new(route, {
    method: 'GET',

    required_query: {
        test: 'boolean'
    },

    required_body: {
        test:'string'
    },

    handler(request) {
        Log.info('Query:', request.dynamic_url);
        request.set_header('test', 'test');

        return Binder.respond(200, 'Balls')
    },
})

router.add_route(route);