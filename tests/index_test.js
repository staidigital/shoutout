var expect = require("chai").expect;
var app=require("../index.js");
var request=require("request");





describe("http", function() {
    it("åpner nettsiden", function(done) {
      var url = "http://localhost:3001/"
      request(url, function(error, response, body) {
          expect(response.statusCode).to.equal(200);
          done();
    });
  });
  it("åpner en side som ikke finnes",function(done){
    var url="http://localhost:3001/thispagedoesnotexist.html"
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(404);
         done();
    });
  });

  it("åpner studentsiden",function(done){
    var url="http://localhost:3001/student.html"
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });

  it("åpner lærersiden",function(done){
    var url="http://localhost:3001/teacher.html"
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });
})

 describe("rooms",function(){
     it("lager et rom",function(){

     });
 })
