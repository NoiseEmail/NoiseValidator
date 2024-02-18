# EmailValidatorPro

Support valid email address patterns that others don't (including unicode characters, IP address domains, quoted local parts, et al.).

Many validators — including the one that's baked into HTML5 — only support more common email addresses. This project aims to support all common addresses along with many rare ones that are considered valid under RFC standards. It works on both client and server side environments.

See the [email address wiki page](https://en.wikipedia.org/wiki/Email_address#Local-part) for more details on acceptable addresses. See some [valid address examples](#valid-addresses) below.

## Usage

### Node

`npm i email-validator-pro -S`

```
let EmailValidatorPro = require("email-validator-pro");
```

Minified version:

```
let EmailValidatorPro = require("email-validator-pro/dist/EmailValidatorPro.min");
```

[![npm](https://nodei.co/npm/email-validator-pro.png)](https://www.npmjs.com/package/email-validator-pro)

### Browser

```
import EmailValidatorPro from "email-validator-pro";
```

Minified version:

```
import EmailValidatorPro from "email-validator-pro/dist/EmailValidatorPro.min";
```

Script tag:

```
<script src="node_modules/email-validator-pro/dist/EmailValidatorPro.min.js"></script>
```

## Notes

- This project is dependency free.
- The source code is written in ES6 and transpiled with Babel.
- If you need to create documentation for local use, run `npm run doc`. Otherwise, visit the online [docs](http://grafluxe.com/o/doc/email-validator-pro/EmailValidatorPro.html).
- Some rare, but RFC compliant email addresses are not supported.
  - See the [unit test](https://rawgit.com/Grafluxe/email-validator-pro/master/test/report.html) lines labeled "Valid, but unsupported..." .
- Pull requests are welcomed.

## Samples

```
let evp = new EmailValidatorPro();

console.log(evp.isValidAddress("john.doe@email.com"));  //true
console.log(evp.isValidAddress("john..doe@email.com")); //false
```

```
let evp = new EmailValidatorPro(),
    parts = evp.getParts("contact@email.com");

console.log(parts); //{local: "contact", domain: "email.com"}
```

See the [full documentation](http://grafluxe.com/o/doc/email-validator-pro/EmailValidatorPro.html).


### Valid Addresses

Patterns like the below are RFC compliant and **supported**.

- `niceandsimple`@`example.com`
- `very.common`@`example.com`
- `a.little.lengthy.but.fine`@`dept.example.com`
- `disposable.style.email.with+symbol`@`example.com`
- `other.email-with-dash`@`example.com`
- `"much.more unusual"`@`example.com`
- `"very.unusual.@.unusual.com"`@`example.com`
- `#!$%&\'*+-/=?^_{}|~`@`example.org`
- `" "`@`example.org`
- `üñîçøðé`@`üñîçøðé.com`
- `admin`@`mailserver1`
- `user`@`tt`
- `"hi"`@`example.com`
- `jsmith`@`[192.168.2.1]`
- `jsmith`@`[IPv6:2001:db8::1]`
- `email`@`123.123.123.123`
- `"()<>[]:,;@\\\"!#$%&\'*+-/=?^_{}| ~.a"`@`example.org`
- `abc."defghi".xyz`@`example.com`
- `_______`@`example.com`
- `very.unusual."@".unusual.com`@`example.com`
- `john.smith(comment)`@`example.com`
- `(comment)john.smith`@`example.com`
- `"()<>[]:,;@\\\"!#$%&\'*+-/=?^_{}| ~.a"(comment)`@`example.org`

### Valid, But Unsupported Addresses

The below are valid (but rare) email addresses that are **not supported**.

- `"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"`@`strange.example.com`
- `"()<>[]:,;@\"!#$%&\'*+-/=?^_{}| ~.a"`@`example.org`
- `abc."d\"efghi".xyz`@`example.com`
- `much."more\ unusual"`@`example.com`

## Unit Tests

See the [unit tests](https://rawgit.com/Grafluxe/email-validator-pro/master/test/report.html).

## License

Copyright (c) 2012, 2017 Leandro Silva (http://grafluxe.com)

Released under the MIT License.

See LICENSE.md for entire terms.
