
# NoiseValidator

## Overview

NoiseValidator is a robust schema validation layer built in TypeScript. It serves as a wrapper for Fastify, providing type strict validation for your application.

## Features

- **Type Strict Validation**: NoiseValidator requires the definition of input and output schemas, ensuring all data is validated.
- **Minimal Dependencies**: We aim to keep the project lean, reducing the potential attack surface and improving maintainability.
- **Type Safety**: We avoid type unsafety such as inappropriate use of `any` or `@ts-ignore`. Our codebase maintains good type safety, with types dynamically inferred from your schema.
- **Error Handling**: NoiseValidator provides generic errors and middleware to enhance processing (DRY) and error handling.

## Getting Started

To get started with NoiseValidator, you'll need to install it as a remote.

```bash
git clone https://github.com/NoiseEmail/NoiseValidator.git
```

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

	// -- Router / Route
	Router,
	Route,
	MethodNotAvailableError,
	NoRouteHandlerError
} from 'noise-validator';
```

## Usage

Here’s a basic example of how to use NoiseValidator to validate a register a route with a `POST` bind:
```typescript
// -- account/schemas.ts
const follow_body_schema = new Schema.Body({
	message: Optional(String),
});

const follow_account_return = new Schema.Body({
	followed_at: Number,
	message: String,
});
```

```typescript
// -- account/follow.ts
const follow_account = new Route('/account/:id/follow', {
	friendly_name: 'Follows an account'
});

Binder(follow_account, 'POST', {
	schemas: {
		body: follow_body_schema,
		output: opaque_init_return
	}
}, async (request) => {
	// ...
});

```
[Schema Type Inference.webm](https://github.com/NoiseEmail/NoiseValidator/assets/83783716/ba6b9f09-10cc-45cc-b386-018cec6e2b2c)
[Output Schema Inference.webm](https://github.com/NoiseEmail/NoiseValidator/assets/83783716/b3cd7dea-35fd-4a10-8495-e5f4b1b7d28a)



