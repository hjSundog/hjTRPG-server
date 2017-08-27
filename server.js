var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [],//大厅
    roomList = {
        'admin':{
            users:[],
            state:0,
            maxNum:10,
            password:''
        }
    },//{'admin':{users:[],state:0,maxNum:10,password}}
    port = process.env.PORT || 3000
    HAIL = 'HAIL';

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
        console.log('socket login' + user.nickname);
        if (users.indexOf(user.nickname) > -1) {
            socket.emit('loginOp',{state:1,msg:'用户已经登录了'});
        } else {
            //socket.userIndex = users.length;
            socket.nickname = user.nickname;         //给socket一个标志，本来可以join这样也行
            socket.emit('loginOp',{state:0,msg:'登录成功'});
            //io.sockets.emit('system', nickname, users.length, 'login');
            //默认加入大厅
            socket.join(HAIL);
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
    socket.on('createRoom',function(roomName){
        var room = {
            users:[],
            state:0,
            maxNum:10,
            password:''
        };
        console.log('socket createRoom ' + roomName);
        if(Object.keys(roomList).includes(roomName)){
            socket.emit('roomOp',{state:1,op:'create',rooms:Object.keys(roomList)});
        }else{
            roomList[roomName] = room;
            socket.emit('roomOp',{state:0,op:'create',rooms:Object.keys(roomList)});
            //广播房间
            socket.broadcast.emit('roomOp',{state:0,op:'create',rooms:Object.keys(roomList)});
        }
    })

    //delete room
    socket.on('deleteRoom',function(roomName){
        console.log('socket deleteRoom '+ roomName);
        delete roomList[roomName];
        socket.emit('roomOp',{state:0,op:'delete'});
    });
    //reset room
    socket.on('resetRoom',function(room){
        console.log('socket resetRoom '+ room);
        //重新更改房间设置
        //code here
        socket.emit('roomOp',{state:0,op:'reset'});
    })
    //update room users
    socket.on('getRoomUsers',function(roomName){
        //get users list in the room
        socket.emit('roomOp',{state:0,users:roomList[room]['users'],op:'roomUsers'});
    })
    //user join room
    socket.on('joinRoom',function(user,roomName){
        console.log(user.nickname + 'socket joinRoom:'+roomName);
        var room = roomList[roomName];
        var roomUsers = room['users'];
        if(roomName === HAIL){
            console.log('房间名不能为大厅');
            return;
        }
        if(roomUsers.length>room.maxNum){
            console.log('已达到最大人数');
            //code here
        }
        //不判定room是否存在了
        roomUsers.push(user);
        //离开大厅
        socket.leave(HAIL);
        //加入房间
        socket.join(roomName);
        socket.room = roomName;
        //更新users
        socket.emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        //广播加入房间信息
        socket.emit('roomOp',{state:0,msg:`${user.nickname} join the room!`,op:'join'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:`${user.nickname} join the room!`,op:'join'});
    })
    //user leaves room
    socket.on('leaveRoom',function(user,roomName){
        console.log('socket leaveRoom');
        if(!roomList[roomName]){
            console.log('room is not exsited');
        }
        var room = roomList[roomName];
        var roomUsers = room['users'];
        //离开房间
        socket.leave(roomName);
        roomUsers.splice(roomUsers.findIndex(function(ele){
            return ele.nickname == user.nickname;
        }),1);
        //回到大厅
        socket.join(HAIL);
        //更新users
        socket.broadcast.to(roomName).emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        //广播离开房间信息
        //socket.emit('roomOp',{state:0,msg:`${user.nickname} leave the room!`,op:'leave'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:`${user.nickname} leave the room!`,op:'leave'});
    });
    //chat with room
    socket.on('chatRoom',function(msg,roomName){
        console.log('socket chatRoom');
        socket.emit('roomOp',{state:0,msg:msg,op:'chat'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:msg,op:'chat'});
    })
    //user leaves app
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            console.log(socket.nickname + 'socket disconnect');
            socket.leave(HAIL);
            console.log('当前大厅还有%d人',users.length);
            //socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('chatHail', function(msg) {
        console.log('socket chatHail');
        //大厅广播
        socket.emit('hailMsg',{user:socket.nickname,msg:msg});
        socket.broadcast.to(HAIL).emit('hailMsg', {user:socket.nickname, msg:msg});
    });
    //new image get
    socket.on('img', function(imgData, color) {
        console.log('socket img');
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});