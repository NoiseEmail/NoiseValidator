# Creating Custom Middleware

### Step 1: Define the Custom Middleware Class

This custom middleware will log request information and validate the presence of a specific header (x-custom-header).

```typescript
import { GenericMiddleware, MiddlewareNamespace, GenericError } from 'noise-validator';

type CustomHeaderMiddlewareOutput = {
    value: string
};

class CustomHeaderMiddleware extends GenericMiddleware<CustomHeaderMiddlewareOutput> {

    protected async handler(): Promise<CustomHeaderMiddlewareOutput> {
        const headers = this.headers;

        // Log the request details
        console.log(`Received request with headers: ${JSON.stringify(headers)}`);

        // Validate the presence of the custom header
        if (!headers['x-custom-header']) {
            throw new GenericError('Missing required header: x-custom-header', 400);
        }

        console.log('Custom header is present');
        return {
            value: headers['x-custom-header']
        }
    }
}

export default CustomHeaderMiddleware;
```

### Step 2: Integrate Middleware into a Route

Now, integrate this middleware into a route using the Binder by passing the class constructor.

```typescript
import { Binder } from 'noise-validator';
import CustomHeaderMiddleware from './middlewares/CustomHeaderMiddleware';
import { Schema, String } from 'noise-validator/src/schema';

const server = new Server({
    debug: true,
    port: 3500,
});

const test_route = new Route(server, '/secure-endpoint', { api_version: 'api/', friendly_name: 'Test route' });

const SomeOutputSchema = new Schema({
    data: String,
});

Binder(test_route, 'GET', {
    middleware: {
        custom_header: CustomHeaderMiddleware, // Pass the class constructor
    },
    schemas: { 
        output: { body: SomeOutputSchema },
    },
}, async ({ middleware }) => {
    // If the middleware validation passes, proceed with the request handler
    // and the returned middleware data is now accesible trough the `middleware`
    // object, eg middleware.custom_middleware.value
    return {
        body: {
            message: 'Request passed custom header validation!',
        }
    };
});

server.start();
```

## Usage Example

Ensure you have the NoiseValidator and related dependencies installed.
Import and use the routes.ts in your server setup.
Make a GET request to `/api/secure-endpoint` with the `x-custom-header` header set.

```bash
curl -H "x-custom-header: some-value" http://localhost:3500/api/secure-endpoint
```

You should see the response:

```json
{
    "data": "Request passed custom header validation!"
}
```

If the x-custom-header is missing, you will get a 400 error response:

```json
{
    ... // Other error data
    "message": "Missing required header: x-custom-header"
}
```





