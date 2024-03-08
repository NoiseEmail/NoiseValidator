import GenericType, { execute } from "./schema/generic_type";

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