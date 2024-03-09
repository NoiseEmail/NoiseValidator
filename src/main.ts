import {
    execute,
    GenericType,
    MissingHandlerError
} from './schema'

class CustomType extends GenericType<{
    test: string
}> {

 
    protected handler = () => {
        
        return this.invalid(new MissingHandlerError("balls not implemented"));

        return {
            test: "test"
        };
    }
}



execute(
    CustomType, 
    "input", 
    (error) => { console.log("Invalid", error.message); },
    (result) => { console.log('valid', result); }
);
