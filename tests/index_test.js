var expect = require("chai").expect;
var request=require("request");
var io     = require('socket.io-client');
var SocketTester = require('socket-tester');
var socket
var app = require('../index');
var socketUrl = 'http://localhost:3001';



var options = {
  transports: ['websocket'],
  'force new connection': true
};

var socketTester = new SocketTester(io, socketUrl, options);



describe("http", function() {
    it("åpner nettsiden", function(done) {
      request(socketUrl, function(error, response, body) {
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

 describe("spørsmål",function(){
     it("sender spørsmål til et eksisterende rom",function(done){
       var client1={
         on:{
           'new question':function(data){
          text=JSON.parse(data).text;
          expect(text).to.equal("Why should we use SCRUM?")
           }
         },
       emit: {
         'create room':'tdt4145',
       }
     };
     var client2={
       emit:{
       'join room' :'tdt4145',
       'new question':'Why should we use SCRUM?'
     }
  };

    socketTester.run([client1,client2],done);
     });
 })
