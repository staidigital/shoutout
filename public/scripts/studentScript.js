var socket = io();

function joinRoom(){
  if($('#roomname').val() === ''){
    return false
  };
  socket.emit('join room', $('#roomname').val());
  localStorage.setItem('roomname', $('#roomname').val());

  $('#createdRoom').text('');
  $('#createdRoom').append('<button class="currentRoomButtonStudent">'+ localStorage.roomname + '</button>');
  $('#roomname').val('');
  window.location.reload();
  return false;
}


$(document).ready(function() {
  if(localStorage.roomname){
    socket.emit('join room', localStorage.roomname);
    $('#createdRoom').text('');
    $('#createdRoom').append('<button class="currentRoomButtonStudent">'+ localStorage.roomname + '</button>');
  }
  return false;
});


// får nytt spørsmål fra serveren og legger til liste
function addToList(question)
{
  $('#questions').prepend($('<div class="box" id="' + question.id + '">')
      .append('<div class="textBox">' + question.text + question.date + '</div>'
              + '<div class="buttonAndVoteContainer">'
              + '<div class="plussButton">'
              + '<button id="voteButton" onclick="buttonPressed(this, ' + question.id + ')" class="stud" role=button >+</button>'
              + '</div>'
              + '<div class="voteCount">'
              + '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>'


          + '</div>'
          + '</div>')


  );
}

// gir stemmefunksjonalitet til knappene
function buttonPressed(button, id){
  var vote = { 'id': id };
  vote.vote = 'plus';
  socket.emit('vote', JSON.stringify(vote));
}

// skrive inn nytt spørsmål og sende til serveren
$('form').submit(function(){
  if($('#inputfield').val() === '') return false;
  socket.emit('new question', $('#inputfield').val()); //sender til serveren, type action og action-data
  $('#inputfield').val('');
  return false;
});

// tar inn nytt spørsmål fra serveren
socket.on('new question', function(question){
  var question = JSON.parse(question);
  console.log(question.id);
  addToList(question);
});

// tar inn ny stemme fra serveren
socket.on('vote', function(question){
  var question = JSON.parse(question);
   $('#vote' + question.id).text(question.votes);
});

// legger til allerede-eksisterende spørsmål til nye brukere
socket.on('all questions', function(questions)
{
  var questions = JSON.parse(questions);
  questions.forEach(function(question)
  {
    addToList(question);
  });
});
socket.on('connectToRoom',function(data){
        console.log(data);
    });

socket.on('already in room', function(){
  $('#roomname').attr("placeholder","FEIL ROM!");
});
