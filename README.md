#ShoutOut Version 1.5.6 25/04/2017

GENERAL INFORMATION
-------------------
ShoutOut is a web application that aims to solve the problem of asking
anonymous questions in lectures. To make it fast and easy to use there is no
need for either the teacher or the student to sign up.

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
other students on each question. If the teacher answers the question, the
question gets automatically  placed at the bottom of the page.

In the students view of the lecture, questions also appear in real-time and
students can vote on each other’s question by clicking the voting button.

HOSTING A LOCAL Server
----------------------
Make sure you are  connected to your local network. Install node.js and
redis.js
https://nodejs.org/en/
https://github.com/MSOpenTech/redis/releases
before running the server. Enter "npm install" in terminal to host the server,
then enter "node index" in terminal.

OPENING THE APPLICATION FROM A Client
-------------------------------------
In your web browser, type host's ip adress followed by a colon followed by the port number
(3001 on default). Example: 10.0.0.2:3001.

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
