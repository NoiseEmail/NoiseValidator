import { mergician } from "mergician";
import { Paramaters } from "../../binder/types";

export const merge_header_schemas = (
    array: Array<Paramaters.Headers>
): Paramaters.Headers => {

    const merger = mergician({
        beforeEach({ depth, key, srcObj, srcVal, targetObj, targetVal }) {
            if (targetVal === undefined) return srcVal;
            if (srcVal === true || targetVal === true) return true;
            return false;
        }
    });


    return merger(...array);
};