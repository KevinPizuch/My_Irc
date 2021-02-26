
var socket = io();
var i;
let room = false;
$('.room_form').hide()
$('.room_rename_form').hide()
$('.user_rename_form').hide()


$('#pseudo').focus();


$('#create_room').click(function (e){
  if(!room){
    $('.room_form').show()
    room = true;
  }
  else{
    $('.room_form').hide()
    room = false;
  }
})

$('.login form').submit(function (e) {
  e.preventDefault();
  var user = $('.login input').val().trim();
  if (user.length > 0) { // Si le champ de connexion n'est pas vide
    socket.emit('user-login', user, function (success) {
      if (success) {
        $(".app").css({ "filter":"none" });
        $('.login').css({'backface-visibility':'hidden','transition': 'transform 1s linear', 'transform':'perspective(800px) rotateY(-180deg)'}); 
        $('.stars').slideUp('slow');
        //$('.login').css({ "display":"none"}); // Cache formulaire de connexion
        $('#chat input').focus(); // Focus sur le champ du message
      }
      else{
        alert('this name already exist, pick another one')
      }
    });
  }
});

$('.room_form form').submit(function (e) {
  e.preventDefault();
  room = false;
  $('.room_form').hide()
  var roomn = $('#create_room_input').val().trim();
  let check = roomn.split(' ');
  if(check.length !== 1){
    alert('error with the channel name')
    return false;
  }
  socket.emit('create-room', roomn, function (fail){
    if(fail){
      alert('A channel with this name already exist, pick another one')
    }
  });
  
});

$('.chat > #input > form').submit(function (e) {
  e.preventDefault();
  var message = $('#m').val();
  $('#m').val('');
  if (message.trim().length !== 0) {
    socket.emit('chat-message', message);
  }
  $('#chat input').focus();
});

socket.on('chat-message', function (message, user) {// msg comme discord dans le channel 
  $('#messages').append($('<li class="user-msg">').html(`
  <div class="msg">
    <div class="info">
      <span><img src="/avatar.png" width="42" height="42"></span> 
    </div>
    <span class="user_name"><font color="#D8A846"><strong>`+ user +`</strong></font></br><p>
    ` + message + ` </p></span>
  </div>`));


  $("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 0);
});

socket.on('service-message', function (message) {

  $('#messages').append($('<li class="Service-Manager">').html(`
      <div class="msg">
        <div class="info">
          <span><img src="/mee.png" width="42" height="42"></span> 
        </div>
        <span class="info_name">MEE6 <button id="bot">BOT</button></br><p id="bott">
        ` + message + ` </p></span>
      </div>`));
    $("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 0);
});

socket.on('user', function(user){
  $('.user_manager li ').remove();
  $('.user_manager').append($('<li class="user">').html('<img src="/avatar.png" width="50" height="50"> <p>#'+user+'</p>'));
  let toggle = false;
  $('.user_manager > .user > p').contextmenu(function(e){
    if(!toggle){
      $('.user_rename_form').show()
      toggle = true
    }
    else{
      $('.user_rename_form').hide()
      toggle = false
    }
    e.preventDefault();
  })
  $('.user_rename_form form').submit(function (e) {
    var user = $('.user_rename_form form input').val().trim();
    socket.emit('rename-user', user);
    $('.user_rename_form').hide()
    toggle = false
    e.preventDefault();
  })
})

socket.on('user-login', function (users, rooms) {
  $('.rooms ul').remove()
  $('.users li').remove()
  for (let indexx = 0; indexx < rooms.length; indexx++) {
    $('.rooms').append($('<ul class="' + rooms[indexx] + '"> ').html('<svg width="22" height="22" viewBox="0 0 24 24" class="icon-1_QxNX"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z"></path></svg><strong class="room" id="'+rooms[indexx] + '">'+rooms[indexx] + '</strong>'))//front comme sur discord avec le # pour les channel 
    for (let index = 0; index < users.length; index++) {
      if(users[index].current_room == rooms[indexx]){
        // $('.'+rooms[indexx] + '> strong').css('color','white')
        $('.'+rooms[indexx]).append($('<li class="' + users[index].username + ' roomUsers">').html('<span id="span_room"><img src="/avatar.png" width="26" height="26"></span> <span class="user_joined">'+users[index].username+'</span>'));
      }
    }
  }
  
  for (let index = 0; index < users.length; index++) {
    $('.users').append($('<li class="' + users[index].username + ' roomUsers">').html('<span id="span_room"><img src="/avatar.png" width="26" height="26"></span> <span class="user_joined">'+users[index].username+'</span>'));
  }

  $('.rooms > ul > .room').click(function (){
    let room = $(this).attr('id');
    socket.emit('join-room', room);
  })
  let toggle = false;
  
  $('.rooms > ul > .room').contextmenu(function(e) {
    let room = $(this).attr('id');
    let x = $(this).position();
    if(toggle){
      $('.room_manager').hide()
      toggle = false
    }
    socket.emit('check-owner', room , function(res){
      if(res){
          $('.room_manager').show()
          toggle = true;
          $('.room_manager button').remove()
          $('.room_manager').append('<button id="delete">Delete</button>')
          $('.room_manager').append('<button id="rename">Rename</button>')
          $('.room_manager').css('top',x.top + 60)
          $('#rename').click(function(e){
            $('.room_manager').hide()
            $('.room_rename_form').show();
            $('.room_rename_form form').submit(function (e) {
              e.preventDefault();
              var roomn = $('#rename_room_input').val().trim();
              let check = roomn.split(' ');
              if(roomn.length == 0){
                $('.room_rename_form').hide()
                alert('error with the new channel name')
                return false;
              }
              if(check.length !== 1){
                $('.room_rename_form').hide()
                alert('error with the new channel name')
                return false;
              }
              $('.room_rename_form').hide();
              socket.emit('rename-room', roomn);
            });
          })
          $('#delete').click(function(e){
            $('.room_manager').hide()
            socket.emit('delete-room', room);
          })
      }else{
        return false;
      }
    })
    e.preventDefault();
  })


});

socket.on('messages-history', function (messages){
  $('.chat li').remove()
  for (let index = 0; index < messages.length; index++) {
    if(messages[index].type == 'service'){
      $('#messages').append($('<li class="Service-Manager">').html(`
        <div class="msg">
          <div class="info">
            <span><img src="/mee.png" width="42" height="42"></span> 
          </div>
          <span class="info_name">MEE6 <button id="bot">BOT</button></br><p id="bott">
          ` + messages[index].message + ' </p></span></div>'));
    }else{
      $('#messages').append($('<li class="user-msg">').html(`
        <div class="msg">
          <div class="info">
            <span><img src="/avatar.png" width="42" height="42"></span> 
          </div>
          <span class="user_name"><font color="#D8A846"><strong>`+ messages[index].user +`</strong></font></br><p>
          ` + messages[index].message + ' </p></span> </div>'
      ));
    }
  }
  if(messages.length == 0){
    $('#messages').append($('<li class="Service-Manager">').html(`
        <div class="msg">
          <div class="info">
            <span><img src="/mee.png" width="42" height="42"></span> 
          </div>
          <span class="info_name">MEE6 <button id="bot">BOT</button></br><p id="bott"> Nobody has talked here yet ! be the first :D  </p></span>
        </div>`));
  }  
    $("#messages").animate({ scrollTop: $('#messages').prop("scrollHeight")}, 0);
})

socket.on('user-logout', function (user) {
  let split = false
  for (let index = 0; index < user.length; index++) {
    if(user[index] == ' ')
      split = true
  }
  if(split){
    let x = user.split(' ')
    for (let index = 0; index < x.length; index++) {
      $('.'+x[index]).remove();
    }
  }else{
    $('.'+user).remove();
  }
});

var typingTimer;
var isTyping = false;

$('#m').keypress(function () {
  clearTimeout(typingTimer);
  if (!isTyping) {
    isTyping = true;
    socket.emit('start-typing');
  }
});

$('#m').keyup(function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(function () {
    if (isTyping) {
      isTyping = false;
      socket.emit('stop-typing');
    }
    isTyping = false;
  }, 1000);
});

socket.on('start-typing', function (typingUsers) {
  $('.typing').show();
  $('.typing').html('<strong>'+typingUsers +' is typing ...</strong>');
});

socket.on('stop-typing', function (typingUsers) {
  $('.typing').hide();
});
