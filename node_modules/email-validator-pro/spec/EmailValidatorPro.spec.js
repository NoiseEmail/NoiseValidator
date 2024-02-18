/**
 * @author Leandro Silva | Grafluxe, 2012+2017
 * @license MIT license
 */

//jshint esversion:6, node:true, jasmine:true

let EmailValidatorPro = require("../src/EmailValidatorPro.js"),
    evp = new EmailValidatorPro();

describe("Valid addresses", () => {
  it(`niceandsimple@example.com should pass`, () => {
    expect(evp.isValidAddress(`niceandsimple@example.com`)).toBe(true);
  });

  it(`niceandsimple@example123-4.com should pass`, () => {
    expect(evp.isValidAddress(`niceandsimple@example123-4.com`)).toBe(true);
  });

  it(`niceandsimple@ex.example.com should pass`, () => {
    expect(evp.isValidAddress(`niceandsimple@ex.example.com`)).toBe(true);
  });

  it(`niceandsimple@ex.xx.xx.example.com should pass`, () => {
    expect(evp.isValidAddress(`niceandsimple@ex.xx.xx.example.com`)).toBe(true);
  });

  it(`very.common@example.com should pass`, () => {
    expect(evp.isValidAddress(`very.common@example.com`)).toBe(true);
  });

  it(`a.little.lengthy.but.fine@dept.example.com should pass`, () => {
    expect(evp.isValidAddress(`a.little.lengthy.but.fine@dept.example.com`)).toBe(true);
  });

  it(`disposable.style.email.with+symbol@example.com should pass`, () => {
    expect(evp.isValidAddress(`disposable.style.email.with+symbol@example.com`)).toBe(true);
  });

  it(`other.email-with-dash@example.com should pass`, () => {
    expect(evp.isValidAddress(`other.email-with-dash@example.com`)).toBe(true);
  });

  it(`"much.more unusual"@example.com should pass`, () => {
    expect(evp.isValidAddress(`"much.more unusual"@example.com`)).toBe(true);
  });

  it(`"very.unusual.@.unusual.com"@example.com should pass`, () => {
    expect(evp.isValidAddress(`"very.unusual.@.unusual.com"@example.com`)).toBe(true);
  });

  it(`#!$%&\'*+-/=?^_\`{}|~@example.org should pass`, () => {
    expect(evp.isValidAddress(`#!$%&\'*+-/=?^_\`{}|~@example.org`)).toBe(true);
  });

  it(`" "@example.org should pass`, () => {
    expect(evp.isValidAddress(`" "@example.org`)).toBe(true);
  });

  it(`üñîçøðé@example.com should pass`, () => {
    expect(evp.isValidAddress(`üñîçøðé@example.com`)).toBe(true);
  });

  it(`üñîçøðé@üñîçøðé.com should pass`, () => {
    expect(evp.isValidAddress(`üñîçøðé@üñîçøðé.com`)).toBe(true);
  });

  it(`admin@mailserver1 should pass`, () => {
    expect(evp.isValidAddress(`admin@mailserver1`)).toBe(true);
  });

  it(`user@tt should pass`, () => {
    expect(evp.isValidAddress(`user@tt`)).toBe(true);
  });

  it(`"hi"@example.com should pass`, () => {
    expect(evp.isValidAddress(`"hi"@example.com`)).toBe(true);
  });

  it(`jsmith@[192.168.2.1] should pass`, () => {
    expect(evp.isValidAddress(`jsmith@[192.168.2.1]`)).toBe(true);
  });

  it(`jsmith@[IPv6:2001:db8::1] should pass`, () => {
    expect(evp.isValidAddress(`jsmith@[IPv6:2001:db8::1]`)).toBe(true);
  });

  it(`postbox@com should pass`, () => {
    expect(evp.isValidAddress(`postbox@com`)).toBe(true);
  });

  it(`"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org should pass`, () => {
    expect(evp.isValidAddress(`"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org`)).toBe(true);
  });

  it(`"()<>[]:,;@\\!#$%&\'*+-/=?^_\`{}| ~.a"@example.org should pass`, () => {
    expect(evp.isValidAddress(`"()<>[]:,;@\\!#$%&\'*+-/=?^_\`{}| ~.a"@example.org`)).toBe(true);
  });

  it(`abc."defghi".xyz@example.com should pass`, () => {
    expect(evp.isValidAddress(`abc."defghi".xyz@example.com`)).toBe(true);
  });

  it(`abc."d\\efghi".xyz@example.com should pass`, () => {
    expect(evp.isValidAddress(`abc."d\\efghi".xyz@example.com`)).toBe(true);
  });

  it(`"abcdefghixyz"@example.com should pass`, () => {
    expect(evp.isValidAddress(`"abcdefghixyz"@example.com`)).toBe(true);
  });

  it(`email@example.com should pass`, () => {
    expect(evp.isValidAddress(`email@example.com`)).toBe(true);
  });

  it(`firstname.lastname@example.com should pass`, () => {
    expect(evp.isValidAddress(`firstname.lastname@example.com`)).toBe(true);
  });

  it(`email@subdomain.example.com should pass`, () => {
    expect(evp.isValidAddress(`email@subdomain.example.com`)).toBe(true);
  });

  it(`firstname+lastname@example.com should pass`, () => {
    expect(evp.isValidAddress(`firstname+lastname@example.com`)).toBe(true);
  });

  it(`email@123.123.123.123 should pass`, () => {
    expect(evp.isValidAddress(`email@123.123.123.123`)).toBe(true);
  });

  it(`email@[123.123.123.123] should pass`, () => {
    expect(evp.isValidAddress(`email@[123.123.123.123]`)).toBe(true);
  });

  it(`"email"@example.com should pass`, () => {
    expect(evp.isValidAddress(`"email"@example.com`)).toBe(true);
  });

  it(`1234567890@example.com should pass`, () => {
    expect(evp.isValidAddress(`1234567890@example.com`)).toBe(true);
  });

  it(`email@example-one.com should pass`, () => {
    expect(evp.isValidAddress(`email@example-one.com`)).toBe(true);
  });

  it(`_______@example.com should pass`, () => {
    expect(evp.isValidAddress(`_______@example.com`)).toBe(true);
  });

  it(`email@example.co.jp should pass`, () => {
    expect(evp.isValidAddress(`email@example.co.jp`)).toBe(true);
  });

  it(`firstname-lastname@example.com should pass`, () => {
    expect(evp.isValidAddress(`firstname-lastname@example.com`)).toBe(true);
  });

  it(`very.unusual."@".unusual.com@example.com should pass`, () => {
    expect(evp.isValidAddress(`very.unusual."@".unusual.com@example.com`)).toBe(true);
  });

  it(`john.smith(comment)@example.com should pass`, () => {
    expect(evp.isValidAddress(`john.smith(comment)@example.com`)).toBe(true);
  });

  it(`(comment)john.smith@example.com should pass`, () => {
    expect(evp.isValidAddress(`(comment)john.smith@example.com`)).toBe(true);
  });

  it(`"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"(comment)@example.org should pass`, () => {
    expect(evp.isValidAddress(`"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"(comment)@example.org`)).toBe(true);
  });
});


describe("Invalid addresses", () => {
  it(`Abc.example.com should fail`, () => {
    expect(evp.isValidAddress(`Abc.example.com`)).toBe(false);
  });

  it(`A@b@c@example.com should fail`, () => {
    expect(evp.isValidAddress(`A@b@c@example.com`)).toBe(false);
  });

  it(`a"b(c)d,e:f;g<h>i[j\k]l@example.com should fail`, () => {
    expect(evp.isValidAddress(`a"b(c)d,e:f;g<h>i[j\k]l@example.com`)).toBe(false);
  });

  it(`just"not"right@example.com should fail`, () => {
    expect(evp.isValidAddress(`just"not"right@example.com`)).toBe(false);
  });

  it(`this is"not\allowed@example.com should fail`, () => {
    expect(evp.isValidAddress(`this is"not\allowed@example.com`)).toBe(false);
  });

  it(`this\ still\"not\\allowed@example.com should fail`, () => {
    expect(evp.isValidAddress(`this\ still\"not\\allowed@example.com`)).toBe(false);
  });

  it(`1234567890123456789012345678901234567890123456789012345678901234+x@example.com should fail`, () => {
    expect(evp.isValidAddress(`1234567890123456789012345678901234567890123456789012345678901234+x@example.com`)).toBe(false);
  });

  it(`the-local-part-of-this-email-address-is-toooooooooooooooooo-long@email.com should fail`, () => {
    expect(evp.isValidAddress(`the-local-part-of-this-email-address-is-toooooooooooooooooo-long@email.com`)).toBe(false);
  });

  it(`me@the-domain-part-of-this-email-address-is-toooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo-long.com should fail`, () => {
    expect(evp.isValidAddress(`me@the-domain-part-of-this-email-address-is-toooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo-long.com`)).toBe(false);
  });

  it(`other(comment)john.smith@example.com should fail`, () => {
    expect(evp.isValidAddress(`other(comment)john.smith@example.com`)).toBe(false);
  });

  it(`x(comment)"()<>[]:,;(comment)@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org should fail`, () => {
    expect(evp.isValidAddress(`x(comment)"()<>[]:,;(comment)@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org`)).toBe(false);
  });

  it(`john..doe@example.com should fail`, () => {
    expect(evp.isValidAddress(`john..doe@example.com`)).toBe(false);
  });
});


describe("Rare and valid addresses, but unsupported", () => {
  it(`"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"@strange.example.com should fail`, () => {
    expect(evp.isValidAddress(`"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"@strange.example.com`)).toBe(false);
  });

  it(`"()<>[]:,;@\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org should fail`, () => {
    expect(evp.isValidAddress(`"()<>[]:,;@\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org`)).toBe(false);
  });

  it(`abc."d\"efghi".xyz@example.com should fail`, () => {
    expect(evp.isValidAddress(`abc."d\"efghi".xyz@example.com`)).toBe(false);
  });

  it(`much."more\ unusual"@example.com should fail`, () => {
    expect(evp.isValidAddress(`much."more\ unusual"@example.com`)).toBe(false);
  });
});


describe("Check email parts", function() {
  it(`me@email.com should return the object {local: "me", domain: "email.com"}`, () => {
    expect(evp.getParts(`me@email.com`)).toEqual({
      local: "me",
      domain: "email.com"
    });
  });

  it(`The local part of niceandsimple@example.com should be "niceandsimple"`, () => {
    expect(evp.getParts(`niceandsimple@example.com`).local).toEqual("niceandsimple");
  });

  it(`The domain part of niceandsimple@example.com should be "example.com"`, () => {
    expect(evp.getParts(`niceandsimple@example.com`).domain).toEqual("example.com");
  });

  it(`The local part of A@b@c@example.com should be "A@b@c"`, () => {
    expect(evp.getParts(`A@b@c@example.com`).local).toEqual("A@b@c");
  });
});
