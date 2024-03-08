import { GenericError } from "./error/types";
import { MissingHandlerError } from "./schema/errors";
import GenericType, { execute } from "./schema/generic_type";
import { Schema } from "./schema/types";

class CustomType extends GenericType<{
    test: string
}> {

 
    protected handler = () => {

        return {
            test: "test"
        };
    }
}



execute(
    CustomType, 
    "input", 
    () => { console.log("Invalid"); },
    (result) => { console.log(result); }
);