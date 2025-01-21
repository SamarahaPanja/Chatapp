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


app.get('/', (req, res) => {
    //return res.sendFile('/public/index.html')

    return res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
    if (rooms[req.params.room] != null) {  //case when room already exsists
        return res.redirect('/')
    }
    rooms[req.body.room] = { users: {} };
    //send message that new room was created
    io.emit('room-created', req.body.room)
    res.redirect(req.body.room)
    
})

app.get('/:room', (req, res) => {
    if (rooms[req.params.room] == null) {
        return res.redirect('/')  //someone tries to access non exsisting room
    }
    res.render('room', { roomName: req.params.room })
})

