<script type="text/javascript">
    var socket = io(location.hostname+':'+location.port);
    var socketMsg = '';
    socket.on('system',function(){

    });

    socket.on('loginOp',function(data){
        if(data.state){

        }
        addMsg(data.msg);
    });

    socket.on('register',function(data){
        switch (data.state) {
            case 0:
                
                break;
            case 1:
                break;
            default:
                // statements_def
                break;
        }
    });

    socket.on('roomOp',function(data){
        switch (data.op) {
            case 'join':
                if(data.state==0){
                    addMsg(data.msg);
                }
                break;
            case 'leave':
                if(data.state==0){
                    addMsg(data.msg);
                }
                break;
            case 'reset':
                if(data.state==0){
                    addMsg(data.msg);
                }   
                break;
            case 'chat':
                if(data.state==0){
                    addMsg(data.msg);
                }
                break;
            default:
                
                break;
        }
    });
</script>