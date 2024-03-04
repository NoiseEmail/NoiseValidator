import { Paramaters } from "../binder/types";


/**
 * @name wrapper
 * This function takes in either a Body or Query schema and returns 
 * a same shaped object, but the custom validators are wrapped in a
 * function that will allow them to update the object in place.
 * 
 * @param {Paramaters.Body | Paramaters.Query} schema - The schema to wrap
 * @param {(path: Array<string>, value: unknown) => void} set_value - The function to wrap the custom validators in
 * @returns {Paramaters.Wrapped} - Returns the wrapped schema
 */
export const wrapper = <
    T extends Paramaters.WrappedBody | Paramaters.WrappedQuery
>(
    schema: Paramaters.Body | Paramaters.Query,
    belongs_to: String,
): T => {

    const walk = (
        schema: Paramaters.Body | Paramaters.Query,
        path: Array<string> = []
    ): Paramaters.Wrapped => {

        const returnable: Paramaters.Wrapped = {};

        for (const key in schema) {

            // -- If the key is not a property of the object, skip it
            if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;

            const value: any = schema[key] as any;

            // -- If the value is an object, we need to walk it
            if (typeof value === 'object') {
                returnable[key] = walk(value, [...path, key]);
                continue;
            }

            // -- If the value is a function, wrap it
            if (typeof value === 'function') returnable[key] = [{
                function: value,
                path: [...path, key],
                belongs_to
            }];

            else returnable[key] = value;
        }

        return returnable;
    }

    return walk(schema, []) as T;
};