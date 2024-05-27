import * as nv from 'noise_validator';


// -- Change the way this is done
//    make it so that there is an importable default configuration
const rerver = new nv.Server({
    port: 3000,
    host: 'localhost'
});



// -- Add optional configuration options
const test_route = new nv.Route(rerver, '/test', { api_version: '1' });


class TestMiddleware extends nv.GenericMiddleware<{
    test: string;
}> {
    
    protected handler = async (): Promise<{
        test: string;
    }> => {
        console.log('Hello world!');
        this.set_header('test', 'Hello world!', 'on-both');
        this.set_cookie('test', {
            value: 'Hello world!',
            options: {
                same_site: 'strict',
                domain: 'localhost',
                secure: true
            }
        
        });

         this.set_cookie('test2', {
            value: 'Hello world!',
            options: {
                same_site: 'strict',
                domain: 'localhost',
                secure: true
            }
         });
        // throw new Error('Hello world!');
        
        return {
            test: 'Hello world!'
        }
    }

}


const test_sechema = new nv.Schema({
    name: nv.String,
    test: {
        name: nv.Number,
        age: nv.String
        
    }

});

const other_schema = new nv.Schema({
    name: nv.String,
    // test: {
    //     name: nv.String // -- Resolve 'never' if we have to clashing types,
    //      make it a union type
    
    // }
});

nv.Binder(test_route, 'GET', {
    middleware: {
        test: TestMiddleware
    },
    schemas: {

    }
}, async (req) => {
    console.log('Hello world! DATA', req.middleware.test);
    console.log(req.headers)

});

await rerver.start();
console.log('Server started...', rerver.address);

// let test: nv.BinderTypes.SchemaOutput.IsOptional<nv.BinderTypes.SchemaOutput.Split<
// {}>>

// -- Test the rerver
console.log('Testing the rerver...');
const response = await fetch(rerver.address + '/1/test?name=test', {
    method: 'GET',
    headers: {
    },

});

const data = await response.json();
console.log(data);
console.log(response.headers);
console.log('Testing complete...');


// -- transiton to ZED for data validation