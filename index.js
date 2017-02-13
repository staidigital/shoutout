// deklarerer variabler
var app = require('express')(); //webserveren
var http = require('http').Server(app);
var webSocket = require('socket.io')(http);
var _ = require('lodash');

var questions = [];
var id = 0;

// setter opp get-funksjon mot nettsiden
app.get('/', function(req,res){
  res.sendFile(__dirname+'/index.html');
});

// bestemmer port
http.listen(3000,function(){
  console.log('Listening on 3000');
});

//når klient kobler seg på
webSocket.on('connection',function(socket){
  console.log('new connection');
  //laste inn tidligere stilte spørsmål
  socket.emit('all questions', JSON.stringify(questions));

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
    questions.push(q);
    webSocket.emit('new question', JSON.stringify(q));
  });

  //ny stemme
  socket.on('vote', function(vote){
    console.log('vote received');
    var vote = JSON.parse(vote);
    var q = _.find(questions, function(q){
      return q.id == vote.id;
    });
    if(q == null) {
      console.log('question not found');
      return;
    }
    if(vote.vote == 'plus') q.votes++;
    else q.votes--;
    console.log('sending vote');
    webSocket.emit('vote', JSON.stringify(q));
  });
});
