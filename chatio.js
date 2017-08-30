var io = require('socket.io')(),
    config = null,
    defaultConfig = {
        'HailModel':'true',
        'hailId':'HAIL',
        'maxRoom':10000,
        'roomDefault':{
            users:[],
            state:0,
            maxNum:10,
            password:'' 
        }
    },
    users = [],//大厅人数
    hailUsers = 0;//在线人数
    roomList = {
    };

/*
    client:
        system
        login 0:成功 1已经存在
        register
 */
io.sockets.on('connection', function(socket) {
    //new user login
    //loginOp
    //  state:0/1
    //  msg:''
    //  
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
            socket.join(config.hailId);  
            users.push(user);
            hailUsers ++;
            socket.emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
            socket.broadcast.to(config.hailId).emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
            //hailUsers.push(user);
        };
    });
    //create room
    //roomOp
    //  state:0/1
    //  op:'create'
    //  rooms:[]
    //  msg:''
    //  self:boolean
    socket.on('createRoom',function(user,roomName){
        var room = config.roomDefault;
        if(!user){
            socket.emit('roomOp',{state:1,op:'create',msg:'需要一个房主来创建房间！'});
            return;
        }
        console.log('socket createRoom ' + roomName);
        if(Object.keys(roomList).includes(roomName)){
            socket.emit('roomOp',{state:1,op:'create',rooms:Object.keys(roomList),msg:'创建房间失败，已有相同名字的房间！'});
        }else{
            roomList[roomName] = room;
            socket.emit('roomOp',{state:0,op:'create',rooms:Object.keys(roomList),msg:'创建房间成功',self:true});
            //广播房间
            socket.broadcast.emit('roomOp',{state:0,op:'create',rooms:Object.keys(roomList)});
        }
    })

    //delete room
    //roomOp
    //  state:0/1
    //  op:'delete'
    //  msg:''
    //delete room
    socket.on('deleteRoom',function(user,roomName){
        console.log(user.nickname + ' will delete the room:' + roomName);
        //检查权限是否房主或者管理员
        //code here
        //检查状态是否可删除
        //code here
        delete roomList[roomName];
    });
    //reset room
    //roomOp
    //  op:'reset'
    //  state:0/1
    //  msg:'重置房间成功'
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
    //每个用户还要维护自己所加入的房间--没实现
    //roomOp
    //  op:'join'
    //  state
    //  msg
 
    // roomOp
    //  op:'updateUsers'
    //  msg:
    //  state
    //  users
    socket.on('joinRoom',function(user,roomName){
        console.log(user.nickname + 'socket joinRoom:'+roomName);
        var room = roomList[roomName];
        if(typeof room == 'undefined'){
            socket.emiet('roomOp',{state:1,op:'join',msg:'不存在房间名'+roomName});
            return;
        }
        var roomUsers = room['users'];
        if(roomName === config.hailId){
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
        socket.leave(config.hailId);
        users.splice(users.findIndex(function(ele){
            return ele.nickname == user.nickname;
        }),1);
        //加入房间
        socket.join(roomName);
        socket.room = roomName;
        socket.emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
        socket.broadcast.to(config.hailId).emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
        //更新users
        socket.emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        //广播加入房间信息
        socket.emit('roomOp',{state:0,msg:`${user.nickname} join the room!`,op:'join'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:`${user.nickname} join the room!`,op:'join'});
    })
    //user leaves room
    //roomOp
    //  op:'leave'
    //  state
    //  msg
    
    //hailOp
    // op:hailUserNum
    // state
    // msg
    // userNum

    // roomOp
    //  op:'updateUsers'
    //  msg:
    //  state
    //  users
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
        socket.join(config.hailId);
        users.push(user);
        socket.emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
        socket.broadcast.to(config.hailId).emit('hailOp',{state:0,userNum:users.length,msg:'',op:'hailUserNum'});
        //更新users
        socket.broadcast.to(roomName).emit('roomOp',{state:0,users:roomUsers,op:'updateUsers'});
        //广播离开房间信息
        //socket.emit('roomOp',{state:0,msg:`${user.nickname} leave the room!`,op:'leave'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:`${user.nickname} leave the room!`,op:'leave'});
    });

    //chat with room
    //roomOp
    //  op:'chat'
    //  msg
    //  state
    socket.on('chatRoom',function(msg,roomName){
        console.log('socket chatRoom');
        socket.emit('roomOp',{state:0,msg:msg,op:'chat'});
        socket.broadcast.to(roomName).emit('roomOp',{state:0,msg:msg,op:'chat'});
    })
    //user leaves app
    //hailOp
    //  op:hailUserNum
    //  state
    //  msg
    //  hailNumber
    
    //hailOp
    //  op:totalUserNum
    //  state
    //  msg
    //  totalUserNum
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            console.log(socket.nickname + 'socket disconnect');
            socket.leave(config.hailId);
            users.splice(users.findIndex(function(ele){
                return ele.nickname == socket.nickname;
            }),1);
/*            hailUsers.splice(hailUsers.findIndex(function(ele){
                return ele.nickname == socket.nickname;
            }),1);*/
            hailUsers--;
            
            console.log('当前大厅还有%d人',users.length);
            socket.broadcast.emit('hailOp', {state:0,userNum:users.length,op:'hailUserNum'});
            socket.broadcast.emit('hailOp', {state:0,totalUserNum:hailUsers,op:'totalUserNum'});
        }
    });
    //new message get
    //hailOp
    //  op:'message'
    //  state:
    //  msg
    //  user
    socket.on('chatHail', function(msg) {
        if(!config.HailModel){
            socket.emit('hailMsg',{user:'System',msg:'当前没有开启大厅模式'});
            return;
        }
        console.log('socket chatHail');
        //大厅广播
        socket.emit('hailOp',{state:0,user:socket.nickname,msg:msg,op:'message'});
        socket.broadcast.to(config.hailId).emit('hailOp', {state:0,user:socket.nickname, msg:msg,op:'message'});
    });
    //new image get
    socket.on('img', function(imgData, color) {
        console.log('socket img');
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});

exports.setDefault = function(pconfig){
    config = Object.assign({},defaultConfig,pconfig);
}

exports.listen = function(server){
    config = config || defaultConfig;
    return io.listen(server);
}