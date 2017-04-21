var app=require('./index')
var socketUrl='http://localhost:3001';

var expect = require("chai").expect;
var request=require("request");

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

setTimeout(function (){
db.all('SELECT username FROM users',function(err,row){
  users=row
});
}, 100);
//sockettester
var io=require('socket.io-client');
var SocketTester = require('socket-tester');
var options = {
  transports: ['websocket'],
  'force new connection': true
};

var socketTester = new SocketTester(io, socketUrl, options);



describe("Client requests", function() {

    it("opens the main page", function(done) {
      request(socketUrl, function(error, response, body) {
          expect(response.statusCode).to.equal(200);
          done();
    });
  });

  it("opens a non-existing page",function(done){
    var url="http://localhost:3001/thispagedoesnotexist.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(404);
         done();
    });
  });

  it("opens student site",function(done){
    var url="http://localhost:3001/student.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });

  it("opens teacher site",function(done){
    var url="http://localhost:3001/teacher.html";
    request(url,function(error,response,body){
         expect(response.statusCode).to.equal(200);
         done();
    });
  });

  it("opens login site",function(done){
  var url="http://localhost:3001/login.html";
  request(url,function(error,response,body){
       expect(response.statusCode).to.equal(200);
       done();
  });
});

   it("opens signup site",function(done){
     var url="http://localhost:3001/signup.html";
     request(url,function(error,response,body){
          expect(response.statusCode).to.equal(200);
          done();
     });
   });

});

describe("Question attribiutes",function(done){
    it("testing the vote function",function(done){
        var client1={
            on:{
            'vote':socketTester.shouldBeCalledNTimes(1)
            },
            emit:{
            'create room':'tdt4145'
            }
         };

var client2={
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

   it("answered function",function(done){
   var client1={
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


describe("Rooms",function(){
it("creates a new room",function(done){
  var client1={
    on:{
      'created room':socketTester.shouldBeCalledNTimes(1)
    },
    emit:{
      'create room':'tdt4202'
    }
  };
    socketTester.run([client1],done);
  });

  it("joins room",function(done){
    var client1={
      on:{
        'connectToRoom':socketTester.shouldBeCalledNTimes(1)
      },
      emit:{'join room':'tdt4202'}
    };
    socketTester.run([client1],done)
});

  it('joins non-existing room',function(done){
    var client1={
      on:{
        'connectToRoom':socketTester.shouldNotBeCalled()
      },
      emit:{'join room':'tdt666'}
    };
    socketTester.run([client1],done)
  });
});

 describe("Qusestions",function(){
     it("Sends questions to a room",function(done){
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

   it("client from different room doesn't recieve the question",function(done){
     var client1={
          on:{
            'new question':socketTester.shouldNotBeCalled()
          },
        emit: {
          'create room':'tdt4145',
        }
      };
      var client2={
        emit:{
          'create room':'tdt4105'
        }
      };
      var client3={
            emit:{
            'join room' :'tdt4105',
            'new question':'Why should we use SCRUM?'
          }
        };
    socketTester.run([client1,client2,client3],done);
       });
    });


   describe("Database testing",function(){
     it("has admin user",function(){
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
     expect(users.username).to.equal('admin');
   }
     });

    it("loads previous questions",function(done){
      client1={
     on:{
       'load archive':socketTester.shouldBeCalledNTimes(1)
     },
     emit:{
       'ready for archive':'admin'
     }
   };
   socketTester.run([client1],done)
    });


     it("archives questions,",function(done){
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
        'load archive':function(data){
          data=JSON.parse(data);
          //assuming you started with an empty database
          var text=data[0].questions[0].text;
          expect(text).to.equal('who are you?')
        }
      },
      emit:{
        'ready for archive':'admin'
      }
    };
       socketTester.run([client1,client2],done);
     });
   });
