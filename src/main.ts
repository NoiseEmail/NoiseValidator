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
    path: '/test:dynamic_url',
    friendly_name: 'Test'
}, Binder.new({
    method: 'GET',

    required_query: {

    },

    handler(request) {
        Log.info('Query:', request.query);
        let a = request.dynamic_url = {
            dynamic_url: 'test'
        }

        request.set_header('test', 'test');

        return Binder.error(500, 'Not found', {
            test: 'test'
        })
    },
}));

Binder.new({
    method: 'GET',

    required_query: {

    },

    handler(request) {
        Log.info('Query:', request.query);
        request.set_header('test', 'test');

        return Binder.error(500, 'Not found', {
            test: 'test'
        })
    },
})

router.add_route(route);