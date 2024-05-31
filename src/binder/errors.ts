import { GenericError } from 'noise_validator/src/error';



class BinderFailedToExecuteError extends GenericError {
    public constructor(
        binder_name: string,
    ) {
        super(`Failed to execute binder ${binder_name}`, 500);
    }
};

class FailedToValidateInputError extends GenericError {
    public constructor(
        binder_name: string,
    ) {
        super(`Failed to validate input [${binder_name}]`, 500);
    }
};    


export {
    BinderFailedToExecuteError,
    FailedToValidateInputError
}