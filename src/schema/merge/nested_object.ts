import { mergician } from "mergician";
import { Paramaters } from "../../binder/types";
import { extract_validator_details } from "../../parser/validate/validate";
import ParserError from "../../parser/error";

export const merge_nested_schemas = <
    T extends Paramaters.WrappedBody | Paramaters.WrappedQuery
>(
    array: Array<T>
): T | Error => {


    try { 
        const merger = mergician({
            appendArrays: false,
            beforeEach({ depth, key, srcObj, srcVal, targetObj, targetVal }) {
        
                // -- If the target value is undefined, then we can't compare
                //    the two, so we just return the source value
                if (targetVal === undefined) return srcVal;
        
        
                // -- Get the details of the validator
                const a_detail = extract_validator_details(srcVal);
                const b_detail = extract_validator_details(targetVal);
        
        
                // -- Make sure the types match
                if (a_detail.type !== b_detail.type) 
                    throw new Error('Types do not match');
        
        
                // -- false overwrites true, and if one is optional, 
                //    the other is not, then it is not optional
                let optional = a_detail.is_optional;
                if (optional === true && b_detail.is_optional === false) 
                    optional = false;
    
                if (a_detail.type === 'custom' || b_detail.type === 'custom') 
                    return [...srcVal, ...targetVal];
                
                if (optional) return 'Optional<' + a_detail.type + '>';
                else return a_detail.type;
            }
        });

        return merger(...array);
    }

    catch (e) {
        return e instanceof Error ? e : new Error(e as string);
    }
};