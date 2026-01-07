const multer = require('multer');
const { time } = require('console');
const express = require('express');
const { type } = require('os');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);


function formatDateDDMMYY(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // months start at 0
  const yy = String(date.getFullYear()).slice(-2);

  return `${dd}${mm}${yy}`;
}

let x = 1;
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const date = formatDateDDMMYY(); // e.g. 07-01-26
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        const ext = path.extname(file.originalname);
        const cleanName = file.originalname
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9_-]/g, '');

        cb(null, `${date}-${cleanName}-${unique}${ext}`);
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

     res.json({
        fileName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`
     });
});

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

        // Send chat history to the newly joined user
        socket.emit('chatHistory', chatHistory);

        // Store the department in the socket for future reference
        

        // Notify others in the department
        socket.broadcast.emit("message", {
            type: 'system',
            text: `${userName} (${department}) joined the chat.`,
            time: new Date().toLocaleTimeString()
        });
    });

    //Receive and broadcast messages within a department
    socket.on('message', ( payload ) => {
        const msg = {
            user: socket.userName,
            department: socket.department,
            // text: text,
            time: new Date().toLocaleTimeString(),

            type: payload.type || 'text',
            text: payload.text || '',
            fileName: payload.fileName || null,
            filePath: payload.filePath || null 
        };

        // Save to chat history
        chatHistory.push(msg);

        // Broadcast the message to everyone (including sender)
        io.emit('message', msg);
        console.log(`Message from ${socket.userName} (${socket.department}):`,
            msg.type === "file" ? msg.fileName : msg.text 
        );
            // ${msg.text}`);
    });

    //Handle disconnection
    socket.on('disconnect', () => {

        if (!socket.userName) return;

        io.emit("message", {
            type: 'system',
            text: `${socket.userName} (${socket.department}) left the chat.`,
            time: new Date().toLocaleTimeString()
        });

            console.log('User disconnected:', socket.id);
        // if (socket.department) {
        //     socket.to(socket.department).emit("message", {
        //         user: socket.userName,
        //         department: socket.department,
        //         type: 'system',
        //         text: `User ${socket.userName} has left the ${socket.department} department.`
        //     });
       // }
    });
});

// Start the server
http.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

