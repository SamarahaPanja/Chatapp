const http = require('http')
const express = require('express')
const fs = require('fs');

const app = express()
const server = http.createServer(app);
const path = require('path')

const { Server } = require('socket.io')
const io = new Server(server)



app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/dynamic-chatapp')
//mongodb://localhost:27017/dynamic-chatapp




const rooms = {}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id)
    socket.on('file-meta',(data)=>{
        console.log('file-meta',data)
        socket.join(data.room)
        socket.in(data.room).emit('fs-meta',data.metadata)
    })
    socket.on('fs-start',(data)=>{
        console.log('fs-start',data)
        socket.in(data.room).emit('fs-share-sender',{})
    })
    socket.on('file-raw',(data)=>{
        socket.in(data.room).emit('fs-share',data.buffer)
    })
    socket.on('new-user', (room, name) => {
        socket.join(room)
        rooms[room].users[socket.id] = name
        socket.to(room).emit('user-connected', name)
    })
    socket.on('disconnect', () => {
        //console.log('user disconnected',socket.id)
        getUserRooms(socket).forEach(room => {
            socket.to(room).emit('user-disconnected', rooms[room].users[socket.id])
            delete rooms[room].users[socket.id]
        })
    })
    socket.on('sendMessage', (room, message) => {
        //console.log(message);

        //io.emit('message', {message:message,name:users[socket.id]})
        //socket.to(room).emit('message', { message: message, name: rooms[room].users[socket.id] }) 
        if (rooms[room]) {
            // Get the user's name from the rooms object
            const userName = rooms[room].users[socket.id];

            if (userName) {
                // Send the message to the room
                socket.join(room)
                io.to(room).emit('message', { message: message, name: userName });
            } else {
                console.log('User not found in room:', socket.id);
            }
        } else {
            console.log('Room does not exist:', room);
        }
    })

})

function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name)
        return names;
    }, []);
}
server.listen(9000, () => console.log('Server started at port 9000'))

//app.use(express.static(path.resolve("./public")));


const userRoute = require('./routes/userRoute');
app.use('/', userRoute)

// app.get('/', (req, res) => {
//     //return res.sendFile('/public/index.html')

//     return res.render('index', { rooms: rooms })
// })

app.post('/room', (req, res) => {
    if (rooms[req.params.room] != null) {  //case when room already exsists
        return res.redirect('/')
    }
    rooms[req.body.room] = { users: {} };
    //send message that new room was created
    io.emit('room-created', req.body.room)
    res.redirect(req.body.room)
    
})

// app.get('/:room', (req, res) => {
//     if (rooms[req.params.room] == null) {
//         return res.redirect('/')  //someone tries to access non exsisting room
//     }
//     res.render('room', { roomName: req.params.room })
// })

app.get('/video/:room', (req, res) => {
    res.render('video',{roomId: req.params.room});
});


const User = require('./models/userModel')
const Chat = require('./models/chatModel')

var usp = io.of('/user-namespace')
usp.on('connection', async (socket)=>{
    console.log('a user connected', socket.id)
    //console.log(socket.handshake.auth.token)
    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id: userId},{$set:{is_online: '1'}})


    //user broadcast online status
    socket.broadcast.emit('getOnlineUser',{user_id: userId})

    socket.on('disconnect', async () => {
        console.log('user disconnected',socket.id)
        userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id: userId},{$set:{is_online: '0'}})

        //user broadcast offline status
        socket.broadcast.emit('getOfflineUser',{user_id: userId})
    })

    //chatting implementation
    socket.on('newChat',(data)=>{
        socket.broadcast.emit('loadNewChat',data)
    })

    //load old chats
    socket.on('exsistsChat',async (data)=>{
        console.log("asked to load chats")
        const chats = await Chat.find({ $or:[
            {sender_id: data.sender_id,receiver_id: data.receiver_id},
            {sender_id: data.receiver_id,receiver_id: data.sender_id},
        ]})
        console.log("chats",chats)
        socket.emit('loadChats',{chats:chats})
    })

    //delete chats
    socket.on('chatDeleted',(id)=>{
        socket.broadcast.emit('chatMessageDeleted',id)
    })
    
})