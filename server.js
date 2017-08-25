var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = ['admin'],
    roomList = {
        'admin':{
            users:[],
            state:0,
            maxNum:10,
            password:''
        }
    },//{'admin':{users:[],state:0,maxNum:10,password}}
    port = process.env.PORT || 3000;

app.get('/',function(req,res){
    res.sendFile(__dirname+'/testServer/testServer.html');
})

server.listen(port,function(){
    console.log('Server is listening at port %d',port)
});
/*
    client:
        system
        login 0:成功 1已经存在
        register
 */
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(user) {
        console.log('socket login');
        if (users.indexOf(user.nickname) > -1) {
            socket.emit('loginOp',{state:1,msg:'用户已经登录了'});
        } else {
            //socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginOp',{state:0,msg:'登录成功'});
            //io.sockets.emit('system', nickname, users.length, 'login');
        };
    });
    //注册
    socket.on('register',function(user){
        console.log('socket register');
        if(users.indexOf(user.nickname)==-1){
            socket.emit('register',{state:0});
            users.push(user);
            //跳转
        }else{
            socket.users.push(user);
            socket.emit('register',{state:1});
        }
    });
    //create room
    socket.on('createRoom',function(room){
        console.log('socket createRoom');
        if(Object.keys(roomList).includes(room.roomName)){
            socket.emit('roomOp',{state:1,op:'create'});
        }else{
            roomList[room.roomName] = room;
            socket.emit('roomOp',{state:0,op:'create'});
        }
    })

    //delete room
    socket.on('deleteRoom',function(room){
        console.log('socket deleteRoom');
        delete roomList[room.roomName];
        socket.emit('roomOp',{state:0,op:'delete'});
    });
    //reset room
    socket.on('resetRoom',function(room){
        console.log('socket resetRoom');
        //重新更改房间设置
        //code here
        socket.emit('roomOp',{state:0,op:'reset'});
    })
    //user join room
    socket.on('joinRoom',function(user,roomName){
        console.log('socket joinRoom:'+roomList[roomName]);
        //不判定room是否存在了
        roomList[roomName]['users'].push(user);
        socket.join(roomName);
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:user.nickename+'join the room!',op:'join'});
    })
    //user leaves room
    socket.on('leaveRoom',function(user,roomName){
        console.log('socket leaveRoom');
        var users = roomList[roomName]['users'];
        socket.leave(roomName);
        users.splice(users.indexOf(user.nickname),1);
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:user.nickename+'leave the room!',op:'leave'});
    });
    //chat with room
    socket.on('chatRoom',function(msg,roomName){
        console.log('socket chatRoom');
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:msg,op:'chat'});
    })
    //user leaves app
    socket.on('disconnect', function() {
        console.log('socket disconnect');
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            users.splice(users.indexOf(socket.nickname), 1);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('chatHail', function(msg, color) {
        console.log('socket chatHail');
        socket.broadcast.emit('hailMsg', {user:socket.nickname, msg:msg});
    });
    //new image get
    socket.on('img', function(imgData, color) {
        console.log('socket img');
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});