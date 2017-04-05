// Dette er koblingen til serveren
var socket = io();
var myroom = '';
var allquestions = [];

function createRoom(){
  localStorage.setItem('roomname', $('#fagkode').val());
  socket.emit('create room', $('#fagkode').val());
  window.location.reload();
}

function saveRoom(){
  console.log(res.body.username);
  var saveallquestions = JSON.stringify(allquestions);
  socket.emit('save questions', saveallquestions)
}

socket.on('created room', function(data){
  $('#createdRoom').text('');
  $('#createdRoom').append('<button class="currentRoomButton">'+ localStorage.roomname + '</button>');
});

function addToArchive(){
  const data = {username: localStorage.username, questions: allquestions, roomname: localStorage.roomname};
  socket.emit('add to archive', JSON.stringify(data));
}

socket.emit('ready for archive', localStorage.username);

socket.on('load archive', function(data){
  console.log(data);
});

$(document).ready(function() {
  if(localStorage.roomname){
    socket.emit('join room', localStorage.roomname);
    $('#createdRoom').text('');
    $('#createdRoom').append('<button class="currentRoomButton">'+ localStorage.roomname + '</button>');
  }
  return false;
});

// får nytt spørsmål fra serveren og legger til liste
function addToList(question) {
  if(question.answered == true){
    $('#questions').prepend($('<div class="box" id="' + question.id + '">')
        .append('<div class="textBox">' + question.text + '</div>'
            + '<div class="buttonAndVoteContainer">'
            + '<div class="plussButton">'
            + '<button onclick="buttonPressed(this, ' + question.id + ')" class="teach teach-clicked" id=" '+ question.id +'" type=button >DONE</button>'
            + '</div>'
            + '<div class="voteCount">'
            + '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>'
            + '</div>'
            + '</div>')
    );
  }else{
    $('#questions').prepend($('<div class="box" id="' + question.id + '">')
        .append('<div class="textBox">' + question.text + '</div>'
            + '<div class="buttonAndVoteContainer">'
            + '<div class="plussButton">'
            + '<button onclick="buttonPressed(this, ' + question.id + ')" id="teach" class="teach" id=" '+ question.id +'" type=button >Answer</button>'
            + '</div>'
            + '<div class="voteCount">'
            + '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>'
            + '</div>'
            + '</div>')
    );
  }
}


// gir svarfunksjon til knappen
function buttonPressed(button, id){
  var answer = { 'id': id, 'room': localStorage.roomname};
  console.log(answer.id);
  var myId = id;
  $("#teach").click(function() {
        $(this).addClass('teach-clicked');
        $(this).html('DONE');
        socket.emit('answer', JSON.stringify(answer));
    });

};

// tar inn nytt spørsmål fra serveren
socket.on('new question', function(question){
  var question = JSON.parse(question);
  console.log(question);
  allquestions.push(question);
  listSort();
  $('#questions').text('');
  allquestions.forEach(function(question)
  {
    addToList(question);
  });
});

// tar inn ny stemme fra serveren
socket.on('vote', function(question){
  var question = JSON.parse(question);
  for(i=0;i<allquestions.length;i++){
    if(allquestions[i].id == question.id){
      allquestions[i].votes++;
    }
  }

  listSort();
  $('#questions').text('');
  allquestions.forEach(function(question)
  {
    addToList(question);
  });
});


socket.on('answered', function(question){
  var question = JSON.parse(question);
  for(i=0;i<allquestions.length;i++){
    if(allquestions[i].id == question.id){
      allquestions[i].answered = true;
    }
  }
  listSort();
  $('#questions').text('');
  allquestions.forEach(function(question)
  {
    addToList(question);
  });
})


function listSort(){
  if(allquestions.length > 1){
    allquestions.sort(function(a,b){
      return(a.votes < b.votes) ? -1 : (( b.votes < a.votes) ? 1 : 0);
    });
  }
  if(allquestions.length > 1){
    allquestions.sort(function(a,b){
      return(a.answered == true) ? -1 : ((b.answered == true) ? 1 : 0);
    });
  }
}

// legger til allerede-eksisterende spørsmål til nye brukere
socket.on('all questions', function(questions) {
  var questions = JSON.parse(questions);
  questions.forEach(function(question)
  {
    addToList(question);
    allquestions.push(question);
  });
  listSort();
});


socket.on('connectToRoom',function(data){
        console.log(data);
});
