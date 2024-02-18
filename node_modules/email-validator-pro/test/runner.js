//jshint node:true

var Jasmine = require("jasmine"),
    jasmine = new Jasmine(),
    HtmlReporter = require("jasmine-pretty-html-reporter").Reporter;

jasmine.loadConfigFile("./spec/support/jasmine.json");
jasmine.addReporter(new HtmlReporter({path: "./test"}));
jasmine.execute();
