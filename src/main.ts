import GenericType, { execute } from "./schema/generic_type";

class CustomType extends GenericType<{
    test: string
}> {

    // Override the overridableFunction
    protected overridableFunction = (tes): any => {
        console.log("Custom implementation of overridableFunction");
        return false;
    }

    // Other methods and properties can be here...
    protected handler = () => {
        return {
            test: "test"
        };
    }
}



execute(
    CustomType, 
    "input", 
    (value) => { console.log("Valid: ", value); }, 
    () => { console.log("Invalid"); }
);