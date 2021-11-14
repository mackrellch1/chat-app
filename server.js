const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'Amplify Chat Bot'

// Run when client connects
io.on('connection', socket => {
    console.log('New WS Connection...')

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to Amplify Chatting Solutions!'))

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`))

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })

    // Broadcast when a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`))

 