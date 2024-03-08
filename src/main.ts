import { GenericError } from "./error/types";
import { MissingHandlerError } from "./schema/errors";
import GenericType, { execute } from "./schema/generic_type";
import { Schema } from "./schema/types";

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