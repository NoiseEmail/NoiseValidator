// import {
//     Binder,
//     GenericMiddleware,
//     Schema,
//     Uuid,
//     Number,
//     String,
//     Optional,
//     Router,
//     Route
// } from 'noise_validator';



// const follow_body_schema = new Schema.Body({
//     message: Optional(String),
// });

// const follow_account_return = new Schema.Body({
//     followed_at: Number,
//     message: String,
// });



// const follow_account = new Route('/account/:id/follow', {
// 	friendly_name: 'Follows an account'
// });

// Binder(follow_account, 'POST', {
// 	schemas: {
// 		body: follow_body_schema,
// 		output: follow_account_return
// 	}
// }, async (request) => {

//     return {
//         followed_at: 0,
//         message: 'Followed account'
//     }

// });


// // class Test1Middleware extends GenericMiddleware<{
// //     a: string
// // }> {
    
// // };

// // class Test2Middleware extends GenericMiddleware<{
// //     b: string
// // }> {
    
// // };



// // const body_1_schema = new Schema.Body({
// //     a: String,
// //     b: Number,
// //     c: Optional(Number)
// // });



// // Router.instance.start({ debug: true });
// // const basic_route = new Route('/basic', { friendly_name: 'Basic Route' });


// // Binder(basic_route, 'GET', {
// //     schemas: {
// //         output: body_1_schema,
// //     }
// // }, (data) => {


// //     return {
// //         a: 'test',
// //         b: 1,
// //         c: 2
// //     }
// // });


// // type test = Split<ExcludeNonOptional<{
// //     a: string,
// //     b: undefined | number,
// // }>>;


// // let b: test['optional'] = {
  
// // };
// // let c: test['required'] = {
    
// // };