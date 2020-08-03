
var users_list = []
var connected_users=[]

module.exports = function sockets(io) {

    io.on('connection', socket => {
        console.log(`${socket.id} joined`)
        users_list.push(socket.id)
        connected_users.push({socketId:socket.id,userId:''})
        socket.emit('join', { id: socket.id })
        socket.on('notify-users',(data)=>{
            if(data.return){
                socket.in(data.ident).emit('add-users', {id:data.id, return:true,username:data.username}) 
            }
            else{
                socket.join(data.ident)
                socket.in(data.ident).emit('add-users', {id:data.id, return:false,username:data.username})
            }
        })
        //socket.broadcast.emit()
        socket.on('chat', (data) => {
            //if (io.sockets.connected[data.id] !== null) {
            socket.to(data.id).emit('chatted', data)
                //}
        })
        socket.on('make-answer', (data) => {
            socket.to(data.id).emit('answer', { id: socket.id, answer: data.answer })
        })
        socket.on('connect-to-user', (data) => {
            socket.to(data.id).emit('offer-made', { id: socket.id, offer: data.offer })
        })
        socket.on('candidate',(data)=>{
            socket.to(data.id).emit('send-candidate',data)
        })
        socket.on('list',(data)=>{
            let ind=connected_users.findIndex(i=>i.socketId == data.id)
            if(ind && ind>=0){
                connected_users[ind].userId=data.idee
            }
            else{
                socket.emit('join', { users: users_list, id: socket.id }) 
            }
        })
        socket.on('invitation',(data)=>{
            let dat=connected_users.filter(i=>i.userId==data.id)
            console.log(connected_users)
            console.log(data)
            console.log(dat)
            socket.to(dat[dat.length-1].socketId).emit('invited',data) 
        })
        socket.on('disconnect', () => {
            console.log(socket.id + ' disconnected')
            users_list = users_list.filter(i => i !== socket.id)
            io.emit('remove-user', socket.id)
        })
    })

}