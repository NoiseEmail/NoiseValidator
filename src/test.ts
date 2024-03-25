// import {
//     Binder,
//     GenericMiddleware,
//     Schema,
//     Uuid,
//     Array,
//     Enum,
//     Number,
//     String,
//     Optional,
//     Router,
//     Route
// } from 'noise_validator';

// import { DynamicURL } from "./route/types";



// const example = new Schema.Body({
//     optional_string: Optional(String),
//     enum: Enum('a', 1, 'c'),
//     optional_no_default: Optional(Array(Uuid)),
//     optional_with_default: Optional(Array(Uuid), ['a']),
// });


// const validated = await example.validate({});
// if (validated.type === 'data') {

//     // -- 'a' | 1 | 'c'
//     validated.data.enum;

//     // -- Array<string>
//     validated.data.optional_with_default;

//     // -- Array<string> | undefined
//     validated.data.optional_no_default;

//     // -- string | undefined
//     validated.data.optional_string;
// }








// const follow_account_return = new Schema.Body({
//     followed_at: Number,
//     message: Optional(String),
// });



// const follow_account = new Route('/account/:id/follow', {
// 	friendly_name: 'Follows an account'
// });

// Binder(follow_account, 'POST', {
// 	schemas: {
// 		body: follow_body_schema,
// 		output: follow_account_return
// 	}
// }, (request) => {

//     request.body.test;
    
//     return {
//         followed_at: Date.now(),

//     }

// });


// class Test1Middleware extends GenericMiddleware<{
//     a: string
// }> {
    
// };

// class Test2Middleware extends GenericMiddleware<{
//     b: string
// }> {
    
// };



// const body_1_schema = new Schema.Body({
//     a: String,
//     b: Number,
//     c: Optional(Number)
// });



// Router.instance.start({ debug: true });
// const basic_route = new Route('/basic', { friendly_name: 'Basic Route' });


// Binder(basic_route, 'GET', {
//     schemas: {
//         output: body_1_schema,
//     }
// }, (data) => {


//     return {
//         a: 'test',
//         b: 1,
//         c: 2
//     }
// });


// type test = Split<ExcludeNonOptional<{
//     a: string,
//     b: undefined | number,
// }>>;


// let b: test['optional'] = {
  
// };
// let c: test['required'] = {
    
// };




