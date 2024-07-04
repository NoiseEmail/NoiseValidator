# NoiseValidator

NoiseValidator is a robust schema validation framework built in TypeScript. It serves as a wrapper for Fastify, providing strict type validation for your application. This ensures that both input and output data adhere to defined schemas, maintaining data integrity and security.

## Features

- Type Strict Validation: Requires the definition of input and output schemas, ensuring all data is validated. This includes output validation to prevent the return of data that doesn't conform to the schema.

- Minimal Dependencies: Aims to keep the project lean, reducing the potential attack surface and improving maintainability.

- Type Safety: Avoids type unsafety, such as inappropriate use of any or @ts-ignore. The codebase maintains strong type safety, with types dynamically inferred from your schema.

- Error Handling: Provides generic errors and middleware to enhance processing and error handling, promoting the DRY principle.


- Type Inference: Translates your schemas to TypeScript types, ensuring end-to-end type safety.


## Local Installation

To get started with NoiseValidator, follow these steps:

1. Clone the Repository:

```bash
git clone https://github.com/NoiseEmail/NoiseValidator.git
```

2. Add Dependency: Add the following dependency to your package.json file:

```json
"dependencies": {
    "noise-validator": "file:./NoiseValidator"
}
```

3. Install Dependencies: Install the dependencies using npm or bun:

```bash
npm install
```

> or

```bash
bun install
```

## Getting Started
> Note: NoiseValidator is still in development and is not yet ready for production use. If you'd like to contribute, please feel free to open a pull request.

To get started with NoiseValidator, you need to set it up as a remote:

```bash
git clone https://github.com/NoiseEmail/NoiseValidator.git
```

## Importing NoiseValidator
Here's how you can import various components from NoiseValidator:

```typescript
import { 
    // -- Schema
    GenericType,
    Schema,
    MissingHandlerError,
    InvalidInputError,
    GenericTypeExecutionError,
    SchemaExecutionError,
    SchemaMissingFieldError,
    Boolean,
    String,
    Number,
    Uuid,
    execute,
    Optional,
    Array,

    // -- Middleware
    GenericMiddleware,
    MiddlewareGenericError,
    MissingMiddlewareHandlerError,

    // -- Logger
    Log,

    // -- Error
    GenericError,

    // -- Binder
    Binder,
    DefaultBinderConfiguration,
    BinderFailedToExecuteError,
    FailedToValidateInputError,
    validate_binder_request,
    validate_output,

    // -- Server / Route
    Server,
    Route,
    MethodNotAvailableError,
    NoRouteHandlerError
} from 'noise-validator';
```
## Creating the server

### Step 1: First, import the Server class from noise_validator and configure your server settings.

```typescript
import { Server } from 'noise_validator';

const server = new Server({
    debug: true,
    port: 3500,
    host: 'localhost',
    body_limit: 1048576 * 2, // 2MB max body size
});

export { server };
```

### Step 2: Middleware Configuration

You have the flexibility to define middleware that runs before and after the main request handler (binder) for every request. Middleware can be specified to run at specific times based on your requirements, this pattern can also be applied to routes and binders.

- Example Configuration: Before / After middleware 
    ```typescript
    import CustomHeaderMiddleware from './middlewares/CustomHeaderMiddleware';
    import CustomFooterMiddleware from './middlewares/CustomFooterMiddleware';
    
    const server = new Server({
        ...,
        middleware: {
            before: {
                customHeader: CustomHeaderMiddleware
            },
            after: {
                customFooter: CustomFooterMiddleware
            }
        }
    });
    ```
    
- Example Configuration: Middleware (Defaults to Before)
    ```typescript
    import CustomHeaderMiddleware from './middlewares/CustomHeaderMiddleware';
    import CustomFooterMiddleware from './middlewares/CustomFooterMiddleware';
    
    const server = new Server({
        ...,
        middleware: {
            customHeader: CustomHeaderMiddleware,
            customFooter: CustomFooterMiddleware
        }
    });
    ```

### Middleware Execution

- Before Middleware: Middleware defined in the before section executes before the main request handler (binder). This can be used for tasks such as input validation, logging, or setting custom headers.

- After Middleware: Middleware defined in the after section executes after the main request handler. This can be used for tasks such as logging responses, modifying responses, or cleaning up resources.

### Creating Middleware

Please read trough [this](https://github.com/NoiseEmail/NoiseValidator/blob/main/MIDDLEWARE.md) guide to learn how to create custom middleware.

## Schemas, Binders and Middlewares
Below are examples showing how to define schemas and routes using NoiseValidator.

### Schema Definition
Define your schemas to ensure data validation:

```typescript
import { Schema, Number, String, Enum, Optional } from 'noise_validator/src/schema';

const Registration = new Schema({
    nickname: String.config({
        min_length: 3,
        max_length: 25,
        regex: /^[a-zA-Z0-9_]*$/
    }),
    email: String,
    password: String.config({
        min_length: 8,
        max_length: 50,
    }),
    year_of_birth: Number.config({
        min: 1900,
        max: new Date().getFullYear()
    }),
    month_of_birth: Number.config({
        min: 1,
        max: 12
    }),
    day_of_birth: Number.config({
        min: 1,
        max: 31
    }),
    first_name: Optional(String.config({
        min_length: 1,
        max_length: 25,
        regex: /^[a-zA-Z]*$/
    })),
    last_name: Optional(String.config({
        min_length: 1,
        max_length: 25,
        regex: /^[a-zA-Z]*$/
    })),
});

const RegistrationResponse = new Schema({
    id: Number,
    details: Registration
    flags: Array(String)
});
```

### Binder and Middleware

Define routes and middleware for handling requests and responses:

```typescript
import { Binder } from 'noise-validator';
import { JWTMiddleware } from '@middleware';
import * as Enums from '../enums';
import * as Models from '../models';
import { Repositories } from '../repositories';
import { account_settings_account_details } './routes';

Binder(account_settings_account_details, 'GET', {
    middleware: {
        jwt: JWTMiddleware({
            method: 'fetch',
            type: Enums.SessionType.LOGIN,
            relations: [
                'user_authentication',
                'user_authentication.two_factor',
            ]
        })
    },
    schemas: {
        output: {
            body: AccountSettings.AccountSecurityDetails
        }
    }
}, async ({ middleware, body }) => {
    const user_authentication = middleware.jwt.user.user_authentication as Models.UserAuthentication;
    return {
        body: {
            mfa_setup: user_authentication.two_factor_state === Enums.State.VERIFIED && user_authentication.two_factor !== null
        }
    }
});
```

## Frontend Integration

Integrate NoiseValidator with your frontend to create a seamless API interface:

```typescript
import { register_api_route } from 'noise_validator/src/client';
import { Account } from 'schemas';

const API_ROOT = 'https://192.168.0.11:5365';

const register_user = register_api_route(API_ROOT, '/account/register', 'POST', {
    input: { body: Account.Registration },
    output: { body: Account.RegistrationResponse },
});

const login_user = register_api_route(API_ROOT, '/account/login', 'PUT', {
    input: { body: Account.Login },
    output: { body: Account.LoginResponse },
});
```

## Contributing

Contributions are welcome! If you’d like to contribute to NoiseValidator, please open a pull request or submit an issue on GitHub.
