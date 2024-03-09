import {
    execute,
    GenericType,
    MissingHandlerError,
    Schema,
    Number,
    Boolean,
    String
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


const user_schema = new Schema({
    name: String,
    id: Number,
    admin: Boolean.config(true)
});



execute(
    CustomType, 
    "input", 
    (error) => { console.log("Invalid", error.message); },
    (result) => { console.log('valid', result); }
);
