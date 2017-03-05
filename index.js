// deklarerer variabler
var express = require('express');
var app = express();
var http = require('http').Server(app);
var webSocket = require('socket.io')(http);
var _ = require('lodash');
var path = require('path');

var questions = [];
var voteids = [];
var id = 0;
var rooms = [];

// setter opp get-funksjon mot nettsiden
app.use('/', express.static(path.join(__dirname, 'public')));
// bestemmer port

http.listen(3001,function(){
  console.log('Listening on 3001');
    });

//når klient kobler seg på
webSocket.on('connection',function(socket){
  var address = socket.handshake.address;
  var myroom = null;
  console.log('new connection');
  //laste inn tidligere stilte spørsmål

  socket.on('create room', function(data){
    console.log('room created');
    var roomobj = {'name' : data, 'questions':[]};
    console.log('room: '+roomobj.name)
    rooms.push(roomobj);
    socket.join(roomobj.name);
    myroom = roomobj.name;
    webSocket.sockets.in(roomobj.name).emit('connectToRoom', 'Du er nå i '+roomobj.name);
    socket.emit('created room', roomobj.room);
  });

  socket.on('join room', function(data){
    var checkRoom = null;
    var checkRoom = _.find(rooms,{'name':data});
    if(checkRoom != null){
      socket.join(data);
      console.log('room joined');
      myroom = data;
      webSocket.sockets.in(data).emit('connectToRoom', 'Du er nå i'+myroom);
      emitAllQuestions();
    }
  });

  function emitAllQuestions(){
    for(var i=0;i<rooms.length;i++){
      if(rooms[i].name === myroom){
        webSocket.sockets.in(myroom).emit('all questions', JSON.stringify(rooms[i].questions));
      }
    }

  }

  //returner id
  exports.get_id=function(){
    return id;
  }
  //når det kommer et nytt spørsmål fra klient
  socket.on('new question', function(question){
    var q =
    {
      'text': question,
      'id': id,
      'votes': 0,
      'answered': false
    }
    id++;
    console.log(q.room);
    for(var i = 0; i<rooms.length;i++){
      if(rooms[i].name == myroom){
        rooms[i].questions.push(q);
        rooms[i].questions.sort();
      }
    };
    webSocket.sockets.in(myroom).emit('new question', JSON.stringify(q));
  });

  //når foreleseren svarer på et spørsmål
  socket.on('answer',function(answer){
    console.log('question answered');
    var answer=JSON.parse(answer);
    var q=_.find(questions,function(q){
      return q.id==answer.id;
    });
    if(q==null){
      console.log('question not found');
      return;
    }
    q.answered=true;
    webSocket.emit('q', JSON.stringify(q))
  });

  //ny stemme
  socket.on('vote', function(vote){
    console.log('vote received');
    var vote = JSON.parse(vote);
    var rom = _.find(rooms, function(rom){
      return rom.name == myroom;
    });
    var q = null;
    for(var i = 0; i<rom.questions.length;i++){
      if(rom.questions[i].id == vote.id){
        q = rom.questions[i];
      }
    }
    if(q == null) {
      console.log('question not found');
      return;
    }
    var addressCheck = _.find(voteids, {
      'address' : address,
      'voteid' : vote.id
    });
    if(addressCheck != null) {
      return;
    }
    var addressobj = {'address' : address, 'voteid' : vote.id};
    voteids.push(addressobj);
    if (vote.vote=='plus')q.votes++;
    console.log('sending vote');
    webSocket.emit('vote', JSON.stringify(q));
  });
});
