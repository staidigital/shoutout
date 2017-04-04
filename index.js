// deklarerer variabler
var express = require('express');
var app = express();
var http = require('http').Server(app);
var webSocket = require('socket.io')(http);
var _ = require('lodash');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var redis = require('redis');
var redisClient = redis.createClient();
redisClient.on('error', function(err){
  console.log('redis error', err);
});
var RedisStore = require('connect-redis')(expressSession);

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
var archives = [];
var port = 3001;

// initializing http, passport and parsers
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(expressSession({
  secret: 'cat',
  resave: false,
  store: new RedisStore({ host: 'localhost', port: 6379, client: redisClient, ttl: 300}),
  cookie: {secure: false, maxAge: 86400000},
  saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//funksjon for hashing av passpord med salt
function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

//opprettelsen av ny bruker
const newUser = function(username, password, res) {
  const salt = crypto.randomBytes(64).toString('base64');
  const hash = hashPassword(password, salt);
  const newUserStatement = db.prepare('INSERT INTO users(username, hash, salt) VALUES(?,?,?)');

  newUserStatement.run(username, hash, salt, function(err) {
    if(err) {
      if(err.code === 'SQLITE_CONSTRAINT') {
        console.log('username taken');
        socket.emit('username taken', true);
        if(res) res.sendFile(path.join(__dirname, './public', 'usernametaken.html'));
      }
    } else {
      if(res) res.sendFile(path.join(__dirname, './public', 'login.html'));
    }
  });
  newUserStatement.finalize();
}

//lager ny database om den ikke eksisterer og en admin-bruker
db.serialize(function(){
  if(!exists){
    db.run('CREATE TABLE "users" (\
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,\
        "username" TEXT,\
        "hash" TEXT,\
        "salt" TEXT,\
        "previousLectures" LONGTEXT,\
        UNIQUE (username)\
    )');
    newUser('admin','admin');
  }
});

//definerer innloggingsstrategi (brukernavn og passord)
passport.use(new LocalStrategy(function(username, password, done) {
  console.log('stareting localstrat: ', username, password);

  db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
    console.log(row);
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

//sjekker om bruker er innlogget
const check_login = function(req, res, next) {
  console.log(req.user);
  if (req.user) {
    console.log('ape');
    next();
  } else {
    console.log(req.user);
    res.send('bar');
  }
}
app.get('/foo', check_login, function(req, res, next){
  res.send('string');
})
//login- og signup-funksjoner med redirect
app.post('/login', passport.authenticate('local', { successRedirect: '/teacher.html',
  failureRedirect: '/login.html' }));

app.post('/signup', function(req, res){
  newUser(req.body.username, req.body.password, res);
});

//når klient kobler seg på
webSocket.on('connection',function(socket){
  var address = socket.handshake.address;
  var myroom = null;
  console.log('new connection');

  //lager nytt rom i.h.t. forespørsel
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

  //bli med i et rom
  socket.on('join room', function(data){
    var checkRoom = null;
    var checkRoom = _.find(rooms,{'name':data});
    if(myroom == data){
      console.log('already in'+myroom);
    }
    else if(checkRoom != null ){
      socket.join(data);
      console.log('room joined', data);
      myroom = data;
      socket.emit('connectToRoom', 'Du er nå i'+myroom);
      socket.emit('all questions', JSON.stringify(checkRoom.questions));
    }
  });

  //function for å alle spørsmålene til et gitt rom
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
    var question =
    {
      'text': question,
      'id': id,
      'votes': 0,
      'answered': false
    }
    id++;

    for(var i = 0; i<rooms.length;i++){
      if(rooms[i].name == myroom){
        rooms[i].questions.push(question);
      }
    };
    console.log(question.id);
    console.log('newquestioninroom', myroom);
    webSocket.sockets.in(myroom).emit('new question', JSON.stringify(question));
  });

  //når foreleseren svarer på et spørsmål
  socket.on('answer',function(answer){
    console.log('question answered');
    var answer=JSON.parse(answer);
    console.log(answer);
    for(var i = 0; i<rooms.length;i++){
      if(rooms[i].name == answer.room){
        var question =_.find(rooms[i].questions,function(question){
          return question.id==answer.id;
        });
      }
    };

    if(question==null){
      console.log('question not found');
      return;
    }
    question.answered=true;
    socket.emit('answered', JSON.stringify(question));
  });

  //ny stemme
  socket.on('vote', function(vote){
    console.log('vote received');
    var vote = JSON.parse(vote);
    var rom = _.find(rooms, function(rom){
      return rom.name == myroom;
    });

    var questions = null;

    for(var i = 0; i<rom.questions.length;i++){
      if(rom.questions[i].id == vote.id){
        question = rom.questions[i];
      }
    }

    if(question == null) {
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

    if (vote.vote=='plus')question.votes++;

    rom.questions.sort(function(a,b){
      return(a.votes < b.votes) ? -1 : ((b.votes < a.votes) ? 1 : 0);
    });

    console.log('sending vote');
    webSocket.emit('vote', JSON.stringify(question));
  });

  socket.on('archive', function(){

  });

});

// shutdown hook //
const shutdown = function() {
console.log("Shutting down ...");
db.close();
process.exit();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// shutdown hook //

// bestemmer port
http.listen(port,function(){
  console.log('Listening on '+port);
});
