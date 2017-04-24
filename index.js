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

//function for hashing passwords with salt
function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

//Creating a new user
const newUser = function(username, password, res) {
  const salt = crypto.randomBytes(64).toString('base64');
  const hash = hashPassword(password, salt);
  const newUserStatement = db.prepare('INSERT INTO users(username, hash, salt, previousLectures) VALUES(?,?,?, ?)');

  newUserStatement.run(username, hash, salt, '[]', function(err) {
    if(err) {
      if(err.code === 'SQLITE_CONSTRAINT') {
        console.log('username taken');
        if(res) res.sendFile(path.join(__dirname, './public', 'usernametaken.html'));
      }
    } else {
      if(res) res.sendFile(path.join(__dirname, './public', 'login.html'));
    }
  });
  newUserStatement.finalize();
}


// Creates a new databse if it doesnt excist and a new admin-user
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

// Defines loginstrategy (Username and password)
passport.use(new LocalStrategy(function(username, password, done) {

  db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
    if (!row) return done(null, false);
    var hash = hashPassword(password, row.salt);
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

//Checks if user is already logged in
const check_login = function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send('bar');
  }
}
app.get('/foo', check_login, function(req, res, next){
  res.send('string');
})
//login- and signup -function with redirect
app.post('/login', passport.authenticate('local', { successRedirect: '/teacher.html',
  failureRedirect: '/login.html' }));

app.post('/signup', function(req, res){
  newUser(req.body.username, req.body.password, res);
});

function addToArchive(data){
  var previousLectures = null;
  db.get('SELECT previousLectures FROM users WHERE username = ?', data.username, function(err, row){
    if(row){
      previousLectures = JSON.parse(row.previousLectures);
      var lecture = { roomname: data.roomname, questions: data.questions };
      previousLectures.push(lecture);
      db.run('UPDATE users SET previousLectures = ? WHERE username = ? ',JSON.stringify(previousLectures), data.username);
    }
  });
}

//When a client connects
webSocket.on('connection',function(socket){
  var address = socket.handshake.address;
  var myroom = null;
  console.log('new connection');

  socket.on('ready for archive', function(data){
    console.log('ready for archive', data);
    if(data){
      db.get('SELECT previousLectures FROM users WHERE username = ?', data, function(err, row){
        if(row){
          var previousLectures = row.previousLectures;

          socket.emit('load archive', previousLectures);
        }
      });
    }
  });

  //Creates a new room with regards to request
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

  // join a room
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

  //Function to load every question to a given room
  function emitAllQuestions(){
    for(var i=0;i<rooms.length;i++){
      if(rooms[i].name === myroom){
        webSocket.sockets.in(myroom).emit('all questions', JSON.stringify(rooms[i].questions));
      }
    }
  }

  //When a student asks a question
  socket.on('new question', function(question){
    if(myroom == null){
      return;
    }
    var date = new Date();
    var question =
    {
      'text': question,
      'id': id,
      'votes': 0,
      'answered': false,
      'date': date.getHours() + ':' + (date.getMinutes()<10?'0':'') + date.getMinutes()
    }
    id++;

    for(var i = 0; i<rooms.length;i++){
      if(rooms[i].name == myroom){
        rooms[i].questions.push(question);
      }
    };
    console.log('newquestioninroom', myroom);
    webSocket.sockets.in(myroom).emit('new question', JSON.stringify(question));
  });

  //When the lecturer answers a question
  socket.on('answer',function(answer){
    console.log('question answered');
    var answer=JSON.parse(answer);
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


  //New vote
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

  socket.on('add to archive', function(data){
    var jsondata = JSON.parse(data);
    //Want to check login TOdoo
    if(jsondata.questions && jsondata.username){
      addToArchive(jsondata);
    }
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

// Deciding which port
http.listen(port,function(){
  console.log('Listening on '+port);
});
