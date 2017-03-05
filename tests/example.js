var expect = require("chai").expect;
var shoutout=require("../index.js")
var request=require("request")

describe("test1", function() {
    var url = "http://localhost:3001/"
    var url2="http://localhost:3001/thispagedoesnotexist.html"
    it("åpner nettsiden", function(done) {
      request(url, function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });
  it("åpner en side som ikke finnes",function(done){
    request(url2,function(error,response,body){
    expect(response.statusCode).to.equal(404);
    done();
    });
  });
})
