import Log from './logger/log';
import Fastify from 'fastify';
import Router from "./router/router";
import Route from "./router/route";


const router = Router.instance;
// router.start();


// server.get('/', async (request, reply) => {
//     return { hello: 'world' };
// });

router.add_route(Route.new({
    configuration: {
        path: ['test'],
        friendly_name: 'Test'
    },

    binders: [
        {
            method: 'GET',

            required_query: {
                'test': 'string',
                'test2': 'Optional<string>',
                'objecta': {
                    'test': 'number',
                    'test2': 'Optional<number>',
                    'custom': (value, reject): boolean => {
                        return true;
                    }
                }
            },

            handler(request) {
                const a = request.query;
                Log.info(a);
            }
        }
    ]
}));