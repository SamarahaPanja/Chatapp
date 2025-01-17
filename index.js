const http = require('http')
const express = require('express')

const app = express()
const server = http.createServer(app);
const path = require('path')

const {Server} = require('socket.io')
const io = new Server(server)

io.on('connection', (socket) => {
    console.log('a user connected',socket.id)
    socket.on('sendMessage',(message)=>{
        console.log(message);
        io.emit('message', message)
    })
})

server.listen(9000, () => console.log('Server started at port 9000'))

app.use(express.static(path.resolve("./public")));

app.get('/', (req, res) =>{
    return res.sendFile('/public/index.html')
})

