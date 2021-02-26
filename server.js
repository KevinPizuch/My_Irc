var express = require('express');
var app = express();
var http = require('http').Server(app);//mhh 
var io = require('socket.io')(http);
var i;


app.use('/', express.static(__dirname + '/public'));
app.get('*', function (req, res){
  return res.sendFile('/public/index.html', { root: __dirname });
})

let users = [];

let messages = [];

let room_messages = [];

let rooms = ['general'];


io.on('connection', function(socket) {
  let loggedUser;
 
  socket.on('disconnect', function() {
    if (loggedUser !== undefined) {
      // Broadcast d'un 'service-message'
      let roomToDisplay;
      var serviceMessage = "<span style='color:#7289DA'>@"+ loggedUser +"</span> has quit this server :(";
      socket.broadcast.emit('service-message', serviceMessage);
      // Suppression de la liste des connectés
      for (let index = 0; index < users.length; index++) {
          if(users[index].username == loggedUser){
              roomToDisplay = users[index].current_room;
              users.splice(index, 1);
          }
      }
      // Ajout du message à l'historique
      //messages.push(serviceMessage);
      room_messages.push({id: room_messages.length, user: loggedUser, room: rooms, message:serviceMessage, type:'service'})

      // Emission d'un 'user-logout' contenant le user
      io.emit('user-logout', loggedUser);
    }
  });

  socket.on('user-login', function(user, callback) {
    var userIndex = -1;
    var current = [];
    let roomToDisplay;
    loggedUser = user;
    for (i = 0; i < users.length; i++) {
      if (users[i].username === user){
        userIndex = i;
      }
    }
    if(user !== undefined && userIndex === -1) { // S'il est bien nouveau
      socket.join(rooms[0])
      users.push({username : user, socket : socket.id, current_room : rooms[0], owner: []});//on definie les info sur l'user pseudo/socket/channel actuel
      var userServiceMessage = 'Hey <span style="color:#7289DA">@' + user + '</span>, just joined this server ! :D';
      room_messages.push({id: room_messages.length, user: loggedUser, room: rooms[0], message:userServiceMessage, type:'service'})
      socket.emit('service-message', userServiceMessage);//msg uniquement a moi
      socket.broadcast.emit('service-message', userServiceMessage);//envoie du msg au channel entier
      messages.push(userServiceMessage);//push dans l'historique
      for (let index = 0; index < users.length; index++) {
        if(users[index].current_room == rooms[0])
          current.push(users[index].username)//pseudo des clients dans le channel courrant (general)
      }
      io.sockets.emit('user-login',users, rooms);//appel client-side
      let history = historyManager(room_messages, rooms[0]);
      io.sockets.in(rooms[0]).emit('messages-history', history);
      socket.emit('user', loggedUser);
      callback(true);
      
    } else callback(false);
  });

  socket.on('create-room', function(room, callback){
    for (let index = 0; index < rooms.length; index++) { //name check
      if(rooms[index] == room){
        callback(true);
        return false;
      }
    }
    for (let index = 0; index < users.length; index++) {//name check
      if(users[index].username == room){
        callback(true);
        return false;
      }
    }

    rooms.push(room);
    var room_user = [];
    var currentRoom;
    var userServiceMessage = 'Hey <span style="color:#7289DA">@' + loggedUser + '</span>, created <strong>' + room + '</strong> !';
    var userServiceMessageFreshRoom = 'I created this room for you, <strong>have fun</strong> ! :D'
    var log = 'Hey @' + loggedUser + ', welcome to '+room+' !';
    socket.emit('service-message', log);//msg uniquement a moi
    
    socket.broadcast.emit('service-message', userServiceMessage)
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser){
        currentRoom = users[index].current_room;
        users[index].current_room = room
        users[index].owner.push(room);
      }
    }
    room_messages.push({id: room_messages.length, user: loggedUser, room: rooms[0], message: userServiceMessage, type:'service'})
    
    socket.leave(currentRoom)
    socket.room = room;
    socket.join(room)
    socket.to(room).emit('service-message', log)
    let history = historyManager(room_messages, room);
    io.sockets.in(room).emit('messages-history', history);
    io.emit('user-login', users, rooms);//appel client-side
    io.sockets.in(room).emit('service-message', userServiceMessageFreshRoom)
  })

  socket.on('join-room', room => {
    let current_room;
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser){
        if(users[index].current_room == room){
          return false;
        }
        current_room = users[index].current_room;
        users[index].current_room = room;
      }
    }
    var log = 'Hey @' + loggedUser + ', welcome to '+room+' !';
    let history = historyManager(room_messages, room);
    socket.leave(current_room)
    socket.room = room;
    socket.join(room)
    socket.to(room).emit('service-message', log)
    io.emit('user-login', users, rooms);//appel client-side
    io.sockets.in(room).emit('messages-history', history);
    
  })

  socket.on('check-owner', function(room, callback){
    for (let index = 0; index < users.length; index++) {//name check
      if(users[index].username == loggedUser){
        for (let j = 0; j < users[index].owner.length; j++) {
           if(users[index].owner[j] == room){
             callback(true);
           }
        }
        // return false;
      }
    }
    callback(false);
  })

  socket.on('rename-user', function(user){
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == user){
        socket.emit('service-message', 'there is already a name like this !');
        return false;
      }      
    }
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser){
        users[index].username = user;
      }
    }
    var log = 'Hey @' + loggedUser + ', renamed himself to '+user+' !';
    socket.broadcast.emit('service-message', log)
    loggedUser = user;
    socket.emit('user', loggedUser);
    io.emit('user-login', users, rooms);//appel client-side
  })

  socket.on('rename-room', function(roomName){
    let currentRoomToRename;
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser){
          currentRoomToRename = users[index].current_room
      }
    }
    
    for (let index = 0; index < rooms.length; index++) {
      if(rooms[index] == roomName){
        socket.emit('service-message', 'A room with this name already exist :(');
        return false;
      }
     }

    for (let index = 0; index < rooms.length; index++) {
     if(rooms[index] == currentRoomToRename){
        rooms[index] = roomName;
     }
    }

    for (let index = 0; index < users.length; index++) {//name check
      if(users[index].username == loggedUser){
        for (let j = 0; j < users[index].owner.length; j++) {
           if(users[index].owner[j] == currentRoomToRename){
              users[index].owner[j] = roomName;
           }
        }
        // return false;
      }
    }

    for (let index = 0; index < users.length; index++) {
      if(users[index].current_room == currentRoomToRename){
        users[index].current_room = roomName;
      }
    }

   
    io.emit('user-login', users, rooms);//appel client-side
    var log = 'Hey @' + loggedUser + ', has renamed '+currentRoomToRename+' to '+roomName+' !';
    socket.broadcast.emit('service-message', log)
  })

  socket.on('delete-room', function(room){
    for (let index = 0; index < rooms.length; index++) {
      if(rooms[index] == room){
        rooms.splice(index, 1);
      }
    }
    for (let index = 0; index < users.length; index++) {
      if(users[index].current_room == room){
        users[index].current_room = rooms[0]
      }
    }
    io.emit('user-login', users, rooms);//appel client-side
    var log = 'Hey @' + loggedUser + ', has deleted '+room+' !';
    socket.broadcast.emit('service-message', log)
  })

  socket.on('chat-message', function(message) {
    //loggedUser;
    let roomToDisplay;
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser)
      roomToDisplay = users[index].current_room;
    }
    room_messages.push({id: room_messages.length, user: loggedUser, room: roomToDisplay, message:message, type:'user'})
    io.sockets.in(roomToDisplay).emit('chat-message', message, loggedUser);
  });
  
  socket.on('start-typing', function () {
    let roomToDisplay;
    
    for (let index = 0; index < users.length; index++) {
      if(users[index].username == loggedUser)
      roomToDisplay = users[index].current_room;
    }
    io.sockets.in(roomToDisplay).emit('start-typing', loggedUser);
  });
  
  socket.on('stop-typing', function () {
    io.emit('stop-typing', loggedUser);
  });

  function historyManager(history, current_room){
    let roomMessages = [];
    for (let index = 0; index < history.length; index++) {
      if(history[index].room.length != 1){
        for (let j = 0; j < history[index].room.length; j++) {
          if(history[index].room[j] == current_room){
            roomMessages.push(history[index]);
          }
        }
      }
      if(history[index].room == current_room)
        roomMessages.push(history[index]);
    }
    return roomMessages;
  }
});


http.listen(3000, function () {
  console.log('Server is listening on *:3000');
});
