import { GenericError } from '@error';



class MissingHandlerError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class InvalidInputError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 400);
    }
};

class GenericTypeExecutionError extends GenericError {
    public constructor(
        message: string,
        name: string
    ) {
        super('Error executing ' + name + ': ' + message, 500);
    }
};

class SchemaExecutionError extends GenericError {
    public constructor(
        message: string,
    ) {
        super(message, 500);
    }
};

class SchemaMissingFieldError extends GenericError {
    public constructor(
        path: Array<string>
    ) {
        super(`Missing field at path: [${path.join(' => ')}]`, 400);
    }
};

export {
    GenericTypeExecutionError,
    SchemaMissingFieldError,
    SchemaExecutionError,
    MissingHandlerError,
    InvalidInputError
};