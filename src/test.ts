import * as nv from 'noise_validator';


// -- Change the way this is done
//    make it so that there is an importable default configuration
const router = nv.Router.instance;



// -- Add optional configuration options
const test_route = new nv.Route('/test');


const test_sechema = new nv.Schema.Body({
    name: nv.String,
    test: {
        name: nv.Number,
        age: nv.Number
        
    }

});

const other_schema = new nv.Schema.Body({
    age: nv.Number,
    test: {
        name: nv.String
    
    }
});

nv.Binder(test_route, 'POST', {
    schemas: {
        input: { body: [test_sechema, other_schema] }
    }
}, async (req) => {
    console.log('Hello world!', req.body.test.name);
});

test_route.add_to_router();
await router.start({ port: 3000 });


let test: nv.SchemaTypes.Schema.ExtractParamaterReturnType<typeof test_sechema> = {
    
    name: 'John',
    
}

// -- Test the router
console.log('Testing the router...');
const response = await fetch(router.address + '/api/DEV/test', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'John', age: 1}),
});

const data = await response.json();
console.log(data);


// -- transiton to ZED for data validation