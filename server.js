var app = require('express')(),
    server = require('http').createServer(app),
    chatio = require('./chatio'),
    port = process.env.PORT || 3000


app.get('/',function(req,res){
    res.sendFile(__dirname+'/testServer/testServer.html');
})

server.listen(port,function(){
    console.log('Server is listening at port %d',port)
});
chatio.setDefault({
    'HailModel':false
});
chatio.listen(server)
