var app=require('./index')
var socketUrl='http://localhost:3001';

var expect = require("chai").expect;
var request=require("request");


//hjelpevariabler
var client1,client2,client3,url
//globale variabler
var users

//hjelpefunksjon
function isArray(obj){
    return !!obj && obj.constructor === Array;
}

//databasen
var fs = require('fs');
var file = 'db.sqlite3';
var exists = fs.existsSync(file);
var sqlite3=require('sqlite3').verbose();
var db=new sqlite3.Database(file);


db.all('SELECT username FROM users',function(err,row){
  users=row
});

//sockettester
var io=require('socket.io-client');
var SocketTester = require('socket-tester');
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
    url="http://localhost:3001/thispagedoesnotexist.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(404);
         done();
    });
  });

  it("åpner studentsiden",function(done){
    url="http://localhost:3001/student.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });

  it("åpner lærersiden",function(done){
    url="http://localhost:3001/teacher.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });

  it("åpner innloginssiden",function(done){
  url="http://localhost:3001/login.html";
  request(url,function(error,response,body){
       expect(response.statusCode).to.equal(200);
       done();
  });
});

   it("åpner signup siden",function(done){
     url="http://localhost:3001/signup.html";
     request(url,function(error,response,body){
          expect(response.statusCode).to.equal(200);
          done();
     });
   });

});

describe("spørsmålsattributer",function(done){
    it("stemmefunksjon",function(done){
        client1={
            on:{
            'vote':socketTester.shouldBeCalledNTimes(1)
            },
            emit:{
            'create room':'tdt4145'
            }
         };

  client2={
           on:{
             'vote':function(data){
              var votes=JSON.parse(data).votes;
              expect(votes).to.equal(1);
              }
           },
           emit:{
      'join room':'tdt4145',
      'new question':'Why is software architecture so important?',
      'vote':JSON.stringify({"id":0,"vote":"plus"}),
      'vote':JSON.stringify({"id":0,"vote":"plus"}),
      'vote':JSON.stringify({"id":0,"vote":"plus"}),
      'vote':JSON.stringify({"id":0,"vote":"plus"})
    }
  };

  socketTester.run([client1,client2],done);
});

   it("svarfunksjon",function(done){
   client1={
     on:{
       'answered':socketTester.shouldBeCalledNTimes(1)
     },
      emit:{
        'create room':'tdt4100',
        'new question':'what is the meaning of life',
        'answer':JSON.stringify({id:1,room:'tdt4100'})
      }
    };
    socketTester.run([client1],done)
   });

});


describe("rom",function(){
it("lager et rom",function(done){
  client1={
    on:{
      'created room':socketTester.shouldBeCalledNTimes(1)
    },
    emit:{
      'create room':'tdt4202'
    }
  };
    socketTester.run([client1],done);
  });

  it("joiner rommet",function(done){
    client1={
      on:{
        'connectToRoom':socketTester.shouldBeCalledNTimes(1)
      },
      emit:{'join room':'tdt4202'}
    };
    socketTester.run([client1],done)
});

});

 describe("spørsmål",function(){
     it("sender spørsmål til et eksisterende rom",function(done){
    client1={
         on:{'new question':socketTester.shouldBeCalledNTimes(1)},
       emit: {
         'create room':'tdt4143',
       }
     };

 client2={
   on:{
       'new question':function(data){
       var text=JSON.parse(data).text;
       expect(text).to.equal("Why should we use SCRUM?")
    }
  },
    emit:{
       'join room' :'tdt4143',
       'new question':'Why should we use SCRUM?'
     }
  };

    socketTester.run([client1,client2],done);
     });

   it("sender spørsmål til et ikke-eksisterende rom",function(done){
     client1={
          on:{
            'new question':socketTester.shouldNotBeCalled()
          },
        emit: {
          'create room':'tdt4145',
        }
      };
      client2={
            emit:{
            'join room' :'tdt4105',
            'new question':'Why should we use SCRUM?'
          }
        };
    socketTester.run([client1,client2],done);
       });
    });
   describe("databasen",function(){
     it("har admin-bruker",function(){
      var adminFound=false;
      if (isArray(users)){
      for (var i = 0; i < users.length; i++) {
       if(users[i].username=='admin'){
         adminFound=true;
       }
     }
     expect(adminFound).to.equal(true);
   }
   else{
     expect(users.usernam).to.equal('admin');
   }
     });
     it("arkiverer spørsmål,",function(done){
       client1={
         emit:{
           'add to archive':JSON.stringify({username:'admin',questions:[
             {text:'who are you?',id:0,votes:5,answered:false,date:'10:17'},
             {text:'what is the meaning of life?',id:1,votes:0, answered:true, date :'10:45'}],
             roomname:'tdt4001'})
         }
       };
       client2={
      on:{
        'load archive':socketTester.shouldBeCalledNTimes(1)
      },
      emit:{
        'ready for archive':'admin'
      }
       }
       socketTester.run([client1,client2],done);

     });
   });
