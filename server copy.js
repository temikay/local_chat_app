const express = require('express');
const { type } = require('os');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//Serve static front-end files
app.use(express.static('public'))

// In-memory chat history store
const chatHistory = [];
    // Choir: [],
    // Media: [],
    // Organizing: [],
    // Prayer: [],
    // BibleStudy: []


//Handle Socket.IO Connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    //Join a department
    socket.on('join', ({userName, department}) => {
        socket.userName = userName;
        socket.department = department;
        
        socket.join(department);
        console.log(`User ${socket.id} joined department: ${department}`);
        socket.emit("message", `You have joined the ${department} department.`);
        socket.to(department).emit("message", `User ${socket.id} has joined the ${department} department.`);

        // Send chat history to the newly joined user
        socket.emit('chatHistory', chatHistory[department]);

        // Store the department in the socket for future reference
        

        // Notify others in the department
        socket.to(department).emit("message", {
            user: socket.id,
            type: 'system',
            text: `User ${socket.id} has joined the ${department} department.`
        });
    });

    //Receive and broadcast messages within a department
    socket.on('departmentMessage', (message) => {
        if (socket.department) {
            io.to(socket.department).emit('message', {
                user: socket.id,
                text: message
            });
            console.log(`Message from ${socket.id} to ${socket.department}: ${message}`);
        }
    });

    //Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.department) {
            socket.to(socket.department).emit("message", {
                user: socket.id,
                type: 'system',
                text: `User ${socket.id} has left the ${socket.department} department.`
            });
        }
    });
});

// Start the server
http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

