#ShoutOut Version 1.0.0 02/03/17

GENERAL INFORMATION
-------------------
ShoutOut is a web application that aims to solve the problem of asking
anonymous questions in lectures. To make it fast and easy to use there is no
need for either the teacher or the student to sign up.

INSTALLATION
------------
If you have a working web browser, there is no need to install anything.


BROWSER COMPATIBILITY
---------------------
Currently tested in Chrome 56 and Firefox 48

=======


------
The web application is split in two views; the teacher and the student. The
teacher starts by making a new lecture with a name, e.g. TDT4140. The students
join the lecture by writing in the name.

In the teachers view of the lecture, questions appear in real-time when the
students publish them and the teacher can also see the number of votes cast by
other students on each question. If the teacher answers the question, they can
remove it from their view.

In the students view of the lecture, questions also appear in real-time and
students can vote on each other’s question by clicking the voting button. When
the teacher answers a question, the question is marked "Answered".

HOSTING A LOCAL Server
----------------------
Make sure you have node.js installed. You can find node.js at
https://nodejs.org/en/ . enter "npm install" in terminal. to host the server,
enter "node index" in terminal.


UNIT TESTING
------------
The unit test is in the test.js file. To be able to run the tests,
you first need to be able to host a server. You also need to open
node_modules/socket-tester/index.js in a text editor and change this.timeout
from 25 to 150 set timeout to higher if you have a slow performing computer.
Delete the database file "db.sqlite3" at the root of the project folder
every time before running the test.  enter "npm test test" in the terminal to
run the test.

CONTRIBUTORS
------------
Sondre Stai
Jørgen Stamnes
Håkon Hoff
Ingvild Høgstøyl
