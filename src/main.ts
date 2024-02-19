import Log from './logger/log';
import Fastify from 'fastify';
import Router from "./router/router";
import Route from "./router/route";
import {validate_object} from "./router/parser/parser";


const router = Router.instance;
router.start();


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
                const a = request.headers.test2;

                Log.info(a);
            }
        }
    ]
}));