// deklarerer variabler
var express = require('express');
var app = express();
var http = require('http').Server(app);
var webSocket = require('socket.io')(http);
var _ = require('lodash');
var path = require('path');
var bodyParser = require('body-parser');

var fs = require('fs');
var file = 'db.sqlite3';
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var crypto = require('crypto');
var db = new sqlite3.Database(file);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var questions = [];
var voteids = [];
var id = 0;
var rooms = [];
var port = 3001;

// setter opp get-funksjon mot nettsiden
app.use(bodyParser.urlencoded({ extended: false}));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
// bestemmer port

http.listen(port,function(){
  console.log('Listening on '+port);
    });

// databasen


function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  console.log('inside hashing alg: ',password, salt);
  return hash.digest('hex');
}

const newUser = function(username, password) {
  const salt = crypto.randomBytes(64).toString('base64');
  const hash = hashPassword(password, salt);
  const newUserStatement = db.prepare('INSERT INTO users(username, hash, salt) VALUES(?,?,?)');
  newUserStatement.run(username, hash, salt);
  newUserStatement.finalize();
}

db.serialize(function(){
  if(!exists){
    db.run('CREATE TABLE "users" (\
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,\
        "username" TEXT,\
        "hash" TEXT,\
        "salt" TEXT\
    )');
    newUser('admin','admin');
  }
});

passport.use(new LocalStrategy(function(username, password, done) {
  console.log('staretring localstrat: ', username, password);

  db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
    if (!row) return done(null, false);
    var hash = hashPassword(password, row.salt);
    console.log('row: ', row);
    db.get('SELECT username, id FROM users WHERE username = ? AND hash = ?', username, hash, function(err, row) {
      if (!row) return done(null, false);
      return done(null, row);
    });
  });
}));

passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, row) {
    if (!row) return done(null, false);
    return done(null, row);
  });
});

app.post('/login', passport.authenticate('local', { successRedirect: '/good-login',
                                                    failureRedirect: '/bad-login' }));
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
      console.log('room joined', data);
      myroom = data;
      //webSocket.sockets.in(data).emit('connectToRoom', 'Du er nå i'+myroom);
      socket.emit('connectToRoom', 'Du er nå i'+myroom);
      socket.emit('all questions', JSON.stringify(checkRoom.questions));
    }

    // send ERROR
    // socket.emit.
  });

  function emitAllQuestions(){
    for(var i=0;i<rooms.length;i++){
      if(rooms[i].name === myroom){
        webSocket.sockets.in(myroom).emit('all questions', JSON.stringify(rooms[i].questions));
      }
    }

  }
  //når det kommer et nytt spørsmål fra klient
  socket.on('new question', function(question){
    if(myroom == null){
      return;
    }
    var q =
    {
      'text': question,
      'id': id,
      'votes': 0,
      'answered': false
    }
    id++;

    for(var i = 0; i<rooms.length;i++){
      if(rooms[i].name == myroom){
        rooms[i].questions.push(q);
      }
    };
    console.log('newquestioninroom', myroom);
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
    rom.questions.sort(function(a,b){
      return(a.votes < b.votes) ? -1 : ((b.votes < a.votes) ? 1 : 0);
    });
    console.log('sending vote');
    webSocket.emit('vote', JSON.stringify(q));
  });
});
