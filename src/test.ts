import * as nv from 'noise_validator';


// -- Change the way this is done
//    make it so that there is an importable default configuration
const rerver = new nv.Server({
    port: 3000,
    host: 'localhost'
});



// -- Add optional configuration options
const test_route = new nv.Route(rerver, '/test', { api_version: '1' });


const test_sechema = new nv.Schema({
    name: nv.String,
    test: {
        name: nv.Number,
        age: nv.String
        
    }

});

const other_schema = new nv.Schema({
    age: nv.Optional(nv.Number),
    // test: {
    //     name: nv.String
    
    // }
});

nv.Binder(test_route, 'POST', {
    schemas: {
        input: { body: [test_sechema, other_schema] },
        output: { body: [test_sechema, other_schema] }
    }
}, async (req) => {
    console.log('Hello world!', req.body.test.age);

    return {
        body: {
            age: undefined,
            name: 'John',
            test: {
                name: 1,
                age: 'a'
            }
        }
    }
});

await rerver.start();
console.log('Server started...', rerver.address);

// let test: nv.BinderTypes.SchemaOutput.Types<typeof other_schema, typeof test_sechema> = {

// }

// -- Test the rerver
console.log('Testing the rerver...');
const response = await fetch(rerver.address + '/1/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
        name: 'John',
        test: {
            name: 1,
            age: 'a'
        }
    }),
});

const data = await response.json();
console.log(data);


// -- transiton to ZED for data validation