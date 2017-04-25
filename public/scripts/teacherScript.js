
// This is the connection to the server
var socket = io();
var myroom = '';
var allquestions = [];
var roomlist = null;

// A function to refresh the page
function refreshPage () {
  window.location.reload();
};

// Function to create a new room
function createRoom () {
  localStorage.setItem('roomname', $('#subjectCode').val().toLowerCase());
  socket.emit('create room', $('#subjectCode').val().toLowerCase());
  window.location.reload();
}

// Function to save the room that you're in
function saveRoom () {
  console.log(res.body.username);
  var saveallquestions = JSON.stringify(allquestions);
  socket.emit('save questions', saveallquestions);
}

// Recieves an emit from the server and changes currentRoomButton
socket.on('created room', function (data) {
  $('#createdRoom').text('');
  $('#createdRoom').append('<button class="currentRoomButton">' + localStorage.roomname + '</button>');
});

function addToArchive () {
  const data = {username: localStorage.username, questions: allquestions, roomname: localStorage.roomname};
  socket.emit('add to archive', JSON.stringify(data));
  window.location.reload();
}

socket.emit('ready for archive', localStorage.username);

socket.on('load archive', function (data) {
  console.log(data);
  roomlist = JSON.parse(data);
  for (var i = 0; i < roomlist.length; i++) {
    $('#room-archive').append('<li><button id="archivedRoom" class="btn btn-primary" \
    onclick="showquestions(' + i + ')">' + roomlist[i].roomname + '</button></li>');
  }
});

function showquestions (data) {
  $('#questions').text('');
  for (var i = 0; i < roomlist.length; i++) {
    if (i == data) {
      roomlist[i].questions.forEach(function (question) {
        addToList(question);
      });
    }
  }
}

$(document).ready(function () {
  if (localStorage.roomname) {
    socket.emit('join room', localStorage.roomname);
    $('#createdRoom').text('');
    $('#createdRoom').append('<button class="currentRoomButton">' + localStorage.roomname + '</button>');
  }

  // Check if LocalStorage is empty, if not, add an h4 tag to currentUsername div

  if (localStorage.getItem('username') !== null) {
    console.log(localStorage.getItem('username'));
    $('#currentUsername').prepend('<h4>Hello, ' + localStorage.getItem('username') + '!</h4>');
  }

  return false;
});

// Recieves a new question from the server and adds to questions list
function addToList (question) {
  if (question.answered == true) {
    $('#questions').prepend($('<div class="box" id="' + question.id + '">')
        .append('<div class="textBox">' + question.text + '</div>' +
            '<div class="dateDiv">' + question.date + '</div>' +
            '<div class="buttonAndVoteContainer">' +
            '<div class="plussButton">' +
            '<button onclick="buttonPressed(this, ' + question.id + ')" class="teach teach-clicked" id=" ' + question.id + '" type=button >DONE</button>' +
            '</div>' +
            '<div class="voteCount">' +
            '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>' +
            '</div>' +
            '</div>')
    );
  } else {
    $('#questions').prepend($('<div class="box" id="' + question.id + '">')
        .append('<div class="textBox">' + question.text + '</div>' +
            '<div class="dateDiv">' + question.date + '</div>' +
            '<div class="buttonAndVoteContainer">' +
            '<div class="plussButton">' +
            '<button onclick="buttonPressed(this, ' + question.id + ')" id="teach" class="teach" id=" ' + question.id + '" type=button >Answer</button>' +
            '</div>' +
            '<div class="voteCount">' +
            '<span class="votespan" id="vote' + question.id + '" >' + question.votes + ' </span>' +
            '</div>' +
            '</div>')
    );
  }
}

// Gives a answer function to the button
function buttonPressed (button, id) {
  var answer = { 'id': id, 'room': localStorage.roomname};
  console.log(answer.id);
  var myId = id;
  $('#teach').click(function () {
    $(this).addClass('teach-clicked');
    $(this).html('DONE');
    socket.emit('answer', JSON.stringify(answer));
  });
};

// takes in a new question from the server
socket.on('new question', function (question) {
  var question = JSON.parse(question);
  console.log(question);
  allquestions.push(question);
  listSort();
  $('#questions').text('');
  allquestions.forEach(function (question) {
    addToList(question);
  });
});

// takes in a new vote from the server
socket.on('vote', function (question) {
  var question = JSON.parse(question);
  for (i = 0; i < allquestions.length; i++) {
    if (allquestions[i].id == question.id) {
      allquestions[i].votes++;
    }
  }

  listSort();
  $('#questions').text('');
  allquestions.forEach(function (question) {
    addToList(question);
  });
});

socket.on('answered', function (question) {
  var question = JSON.parse(question);
  for (i = 0; i < allquestions.length; i++) {
    if (allquestions[i].id == question.id) {
      allquestions[i].answered = true;
    }
  }
  listSort();
  $('#questions').text('');
  allquestions.forEach(function (question) {
    addToList(question);
  });
});

function listSort () {
  if (allquestions.length > 1) {
    allquestions.sort(function (a, b) {
      return (a.votes < b.votes) ? -1 : ((b.votes < a.votes) ? 1 : 0);
    });
  }
  if (allquestions.length > 1) {
    allquestions.sort(function (a, b) {
      return (a.answered == true) ? -1 : ((b.answered == true) ? 1 : 0);
    });
  }
}

// adds an excisting question to new users
socket.on('all questions', function (questions) {
  var questions = JSON.parse(questions);
  questions.forEach(function (question) {
    addToList(question);
    allquestions.push(question);
  });
  listSort();
});

socket.on('connectToRoom', function (data) {
  console.log(data);
});
