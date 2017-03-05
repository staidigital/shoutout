var expect = require("chai").expect;
var shoutout=require("./index.js")
var request=require("request")

describe("test1", function() {
    var url = "http://localhost:3001/"
    it("åpner nettsiden", function(done) {
      request(url, function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
})
