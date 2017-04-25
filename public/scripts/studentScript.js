var socket = io();

function joinRoom () {
  if ($('#roomname').val() === '') {
    return false;
  };
  socket.emit('join room', $('#roomname').val().toLowerCase());
  localStorage.setItem('roomname', $('#roomname').val().toLowerCase());

  $('#createdRoom').text('');
  $('#createdRoom').append('<button class="currentRoomButtonStudent">' + localStorage.roomname + '</button>');
  $('#roomname').val('');
  window.location.reload();
  return false;
}

$(document).ready(function () {
  if (localStorage.roomname) {
    socket.emit('join room', localStorage.roomname);
    $('#createdRoom').text('');
    $('#createdRoom').append('<button class="currentRoomButtonStudent">' + localStorage.roomname + '</button>');
  }
  return false;
});

// Recieves a new question from the server and adds to the question list
function addToList (question) {
  $('#questions').prepend($('<div class="box" id="' + question.id + '">')
      .append('<div class="textBox">' + question.text + '</div>' +
              '<div class="dateDiv">' + question.date + '</div>' +
              '<div class="buttonAndVoteContainer">' +
              '<div class="plussButton">' +
              '<button id="voteButton" onclick="buttonPressed(this, ' + question.id + ')" class="stud" role=button >+</button>' +
              '</div>' +
              '<div class="voteCount">' +
              '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>' +

          '</div>' +
          '</div>')

  );
}

// gives votingfunctionality to the buttons
function buttonPressed (button, id) {
  var vote = { 'id': id };
  vote.vote = 'plus';
  socket.emit('vote', JSON.stringify(vote));
}

// Write a new question and sends to the server
$('form').submit(function () {
  if ($('#inputfield').val() === '') return false;
  socket.emit('new question', $('#inputfield').val()); // sender til serveren, type action og action-data
  $('#inputfield').val('');
  return false;
});

// takes in a new question from the server
socket.on('new question', function (question) {
  var question = JSON.parse(question);
  console.log(question.id);
  addToList(question);
});

// takes in a new vote from the server
socket.on('vote', function (question) {
  var question = JSON.parse(question);
  $('#vote' + question.id).text(question.votes);
});

// adds an excisting question to new users
socket.on('all questions', function (questions) {
  var questions = JSON.parse(questions);
  questions.forEach(function (question) {
    addToList(question);
  });
});
socket.on('connectToRoom', function (data) {
  console.log(data);
});

socket.on('already in room', function () {
  $('#roomname').attr('placeholder', 'FEIL ROM!');
});
