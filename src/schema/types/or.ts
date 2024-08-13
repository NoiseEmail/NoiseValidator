import GenericType from '../generic';
import { GenericError } from 'noise_validator/src/error';
import { SchemaNamespace } from '../types';
import Schema from '../schema';



class OrTypeClass<
    OriginalReturnTypeA,
    OriginalInputShapeA,
    OriginalReturnTypeB,
    OriginalInputShapeB,
> extends GenericType<
    OriginalReturnTypeA | OriginalReturnTypeB,
    OriginalInputShapeA | OriginalInputShapeB
> { 
    _original_constructor_a: 
        SchemaNamespace.GenericTypeConstructor<OriginalReturnTypeA, OriginalInputShapeA> |
        SchemaNamespace.SchemaLike;
    _original_constructor_b: 
        SchemaNamespace.GenericTypeConstructor<OriginalReturnTypeB, OriginalInputShapeB> |
        SchemaNamespace.SchemaLike;
    _input_value: OriginalInputShapeA | OriginalInputShapeB;

    constructor(
        input_value: unknown,
        original_constructor_a: 
            SchemaNamespace.GenericTypeConstructor<OriginalReturnTypeA, OriginalInputShapeA> |
            SchemaNamespace.SchemaLike,
        original_constructor_b: 
            SchemaNamespace.GenericTypeConstructor<OriginalReturnTypeB, OriginalInputShapeB> |
            SchemaNamespace.SchemaLike
    ) {
        super(input_value);
        this._input_value = input_value as OriginalInputShapeA | OriginalInputShapeB;
        this._original_constructor_a = original_constructor_a;
        this._original_constructor_b = original_constructor_b;
    }

    public async _attempt_execution(
        input_constructor: OriginalInputShapeA | OriginalInputShapeB, 
        data: unknown
    ) {
        switch (input_constructor instanceof Schema) {
            case true: {
                const schema = input_constructor as SchemaNamespace.SchemaLike<OriginalReturnTypeA | OriginalReturnTypeB>;
                const validated_data = await schema.validate(data);
                return validated_data;
            }

            case false: {
                const constructor = input_constructor as SchemaNamespace.GenericTypeConstructor<
                    OriginalReturnTypeA | OriginalReturnTypeB, OriginalInputShapeA | OriginalInputShapeB>;
                const instance = new constructor(data);
                const result = await instance.execute();
                if (result.success === true) return result.data;
                else throw result.data;
            }
        }
    };

    public async handler(): Promise<OriginalReturnTypeA | OriginalReturnTypeB> {
        
        try {
            const result_a = await this._attempt_execution(this._original_constructor_a as OriginalInputShapeA, this._input_value);
            return result_a as OriginalReturnTypeA;
        } catch {}

        try {
            const result_b = await this._attempt_execution(this._original_constructor_b as OriginalInputShapeB, this._input_value);
            return result_b as OriginalReturnTypeB;
        } catch {}

        throw new GenericError('OrTypeClass', 400);
    }
};



const create_Or = <
    OriginalReturnTypeA,
    OriginalInputShapeA,
    OriginalReturnTypeB,
    OriginalInputShapeB
>(
    a: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnTypeA, 
        OriginalInputShapeA
    > | OriginalReturnTypeA,

    b: SchemaNamespace.GenericTypeConstructor<
        OriginalReturnTypeB, 
        OriginalInputShapeB
    > | OriginalReturnTypeB

) => (class extends OrTypeClass<
        OriginalReturnTypeA,
        OriginalInputShapeA,
        OriginalReturnTypeB,
        OriginalInputShapeB
    > {
    constructor(input_value: unknown) {
        super(
            input_value, 
            a as SchemaNamespace.SchemaLike, 
            b as SchemaNamespace.SchemaLike
        );
    }
});



export default create_Or;