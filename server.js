var express = require('express'), path = require('path');
var app = require('express')();

app.use(express.static(path.join(__dirname, 'public')));


var server = require('http').Server(app);
var io = require('socket.io')(server);


server.listen(81);
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
  // res.sendFile
});

app.get('/chat/:username', function (req, res) {
  res.sendFile(__dirname + '/public/private.html');
});


var numUsers = 0, chatUsers = {};

io.on('connection', function (socket) {
	var addedUser = false;

	socket.on('new message', function (data) {
		socket.broadcast.to(data.room).emit('new message', {
			username: socket.username,
			message: data.message
		});
	});

	socket.on('add user', function (data) {
		if (addedUser) return;

		socket.username = data.username;
		socket.room = data.room;
		if (!chatUsers[data.room]) {
			chatUsers[data.room] = [];
		}
		chatUsers[data.room].push(data.username);
		socket.join(data.room);

		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers,
			chatUsers: chatUsers[data.room]
		});

		var tmpUsers = chatUsers[socket.room];
// 		var index = tmpUsers.indexOf(socket.username);
// 			tmpUsers.splice(index, 1);

		socket.broadcast.to(data.room).emit('user joined', {
			username: socket.username,
			numUsers: numUsers,
			chatUsers: tmpUsers
		});
	});

	socket.on('stop typing', function (data) {
		socket.broadcast.to(data.room).emit('stop typing', {
			username: socket.username
		});
	});

	socket.on('typing', function (data) {
		socket.broadcast.to(data.room).emit('typing', {
			username: socket.username
		});
	});

	socket.on('disconnect', function () {
		if (addedUser) {
			
			var index = chatUsers[socket.room].indexOf(socket.username);
			chatUsers[socket.room].splice(index, 1);

			--numUsers;

			socket.broadcast.to(socket.room).emit('user left', {
				username: socket.username,
				numUsers: numUsers,
				chatUsers: chatUsers[socket.room]
			});
		}
	});
});
