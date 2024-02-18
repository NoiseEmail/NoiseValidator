/**
 * @author Leandro Silva
 * @copyright 2012, 2017 Leandro Silva (http://grafluxe.com)
 * @license MIT
 *
 * @classdesc
 * Validate email address patterns that others don't. This project aims to support all common addresses along
 * with many rare ones that are considered valid under RFC standards. It can be used in both client and server
 * side environments.
 *
 * <p>
 *   <b>Valid email addresses that are supported:</b>
 *   <ul>
 *     <li>niceandsimple@example.com</li>
 *     <li>very.common@example.com</li>
 *     <li>a.little.lengthy.but.fine@dept.example.com</li>
 *     <li>disposable.style.email.with+symbol@example.com</li>
 *     <li>other.email-with-dash@example.com</li>
 *     <li>"much.more unusual"@example.com</li>
 *     <li>"very.unusual.@.unusual.com"@example.com</li>
 *     <li>#!$%&\'*+-/=?^_\`{}|~@example.org</li>
 *     <li>" "@example.org</li>
 *     <li>üñîçøðé@üñîçøðé.com</li>
 *     <li>admin@mailserver1</li>
 *     <li>user@tt</li>
 *     <li>"hi"@example.com</li>
 *     <li>jsmith@[192.168.2.1]</li>
 *     <li>jsmith@[IPv6:2001:db8::1]</li>
 *     <li>email@123.123.123.123</li>
 *     <li>"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org</li>
 *     <li>abc."defghi".xyz@example.com</li>
 *     <li>_______@example.com</li>
 *     <li>very.unusual."@".unusual.com@example.com</li>
 *     <li>john.smith(comment)@example.com</li>
 *     <li>(comment)john.smith@example.com</li>
 *     <li>"()<>[]:,;@\\\"!#$%&\'*+-/=?^_\`{}| ~.a"(comment)@example.org</li>
 *   </ul>
 *
 *   <b>Valid (but rare) email addresses that are not supported:</b>
 *   <ul>
 *     <li>"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"@strange.example.com</li>
 *     <li>"()<>[]:,;@\"!#$%&\'*+-/=?^_\`{}| ~.a"@example.org</li>
 *     <li>abc."d\"efghi".xyz@example.com</li>
 *     <li>much."more\ unusual"@example.com</li>
 *   </ul>
 * </p>
*/

//jshint esversion:6, node:true

class EmailValidatorPro {
  /**
   * Checks whether an email address is valid.
   * @param   {String}  address An email address.
   * @returns {Boolean}
   */
  isValidAddress(address) {
    return (this._whitelist(address) && !this._blacklist(address) && !this._tooLong(address));
  }

  /**
   * Gets the two parts of an email address (local and domain). This method does not check your email validity.
   * @param   {String} address An email address.
   * @example
   * let evp = new EmailValidatorPro(),
   *     parts = evp.getParts("contact@email.com");
   *
   * console.log(parts); //{local: "contact", domain: "email.com"}
   * @returns {Object}
   */
  getParts(address) {
    let domainMatch = address.match(/[^@]*$/);

    return {
      local: address.substr(0, domainMatch.index - 1) || "",
      domain: domainMatch[0] || ""
    };
  }

  _whitelist(address) {
    return /^(?=\s)|^(?:(?!.+\.{2,})(?!\.)(?:[\w.!#$%&'*+\-\/=?\^`{|} ~]|[^\x00-\x7F])+[^\."]@|^"(?:[\w.!#$%&'*+\-\/=?\^`{|} ~(),:;<>@\[\]]|[^\x00-\x7F])+"@|(?:[\w.!#$%&'*+\-\/=?\^`{|} ~]|[^\x00-\x7F])+\."(?:[\w.!#$%&'*+\-\/=?\^`{|} ~"(),:;<>\\@\[\]]|[^\x00-\x7F])+"\.(?:[\w.!#$%&'*+\-\/=?\^`{|} ~]|[^\x00-\x7F])+@)(?!-)(?!.*-\.)(?:[a-zA-Z0-9-.]|[^\x00-\x7F])+$|^".+"@.+|.+@\[(?:\w+\.|\w+:){3}.+\]|^\(.+\)|\(.+\)@/.test(address);
  }

  _blacklist(address) {
    return /^@|^\s|@\[?(?=\d).*\d{4,}|"(?!.+\\").+".+"|.\(.+\)@(?=.+@)/.test(address);
  }

  _tooLong(address) {
    let pts = this.getParts(address);

    return (pts.domain.length >= 253 || pts.local.length >= 64 || address.length >= 254);
  }

}

//Support CJS/Node
if (typeof module === "object" && module.exports) {
  module.exports = EmailValidatorPro;
}
