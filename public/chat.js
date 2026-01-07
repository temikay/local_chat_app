const socket = io();

let userName = '';
let department = '';

document.getElementById("chatForm").addEventListener("submit", function (e) {
  e.preventDefault(); // 🚫 stops page reload & ?
  
  const message = document.getElementById("message").value;
  console.log(message);

  // send message via socket / fetch here
});


const fileInput = document.getElementById('fileInput');
const fileNameLabel = document.getElementById('fileName');

// Update the file name label when a file is selected
fileInput.addEventListener('change', function () {
    const fileName = fileInput.files[0] ? fileInput.files[0].name : 'No file chosen';
    fileNameLabel.textContent = fileName;
});

// Prompt for user details
function joinChat() {
    nameInput = document.getElementById('username').value.trim();
    deptSelect = document.getElementById('department').value.trim();

    document.getElementById('headerArea').classList.add('shrink-header');

    userName = nameInput;
    department = deptSelect;

    if (!userName || !department) {
        alert('Please enter both your name and department.');
        return;
    }

    // Emit join event to server
    socket.emit('join', { userName, department });

    document.getElementById('joinSection').classList.add('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    document.getElementById('roomTitle').textContent = `${deptSelect} Department ◾ ${userName}`;

    clearMessages();
}

async function sendMessageWithFile() {
    const text = messageInput.value.trim();
    const file = fileInput.files[0];

    // if nothing provided, do nothing
    if (!text && !file) return;

    // Upload file first if any
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        socket.emit("message",  {
            type: 'file',
            text,
            fileName: data.fileName,
            filePath: data.filePath
        });
            // `<em style=" font-weight: bold;">${userName}:</em> ${text} <br><a href="${data.filePath}" target="_blank">📎 ${data.fileName}</a>`);

        
    }

    // text only message
    else {
        socket.emit("message", {
            type: 'text',
            text
        });

        
    }
    messageInput.value = "";
    fileInput.value = '';
    fileNameLabel.textContent = 'No file chosen';
        // messageInput.value = "";

        // `<em style=" font-weight: bold;">${userName}:</em> ${text}`);
    }


// function sendMessage() {
//     const input = document.getElementById("messageInput");
//     const message = input.value.trim();

//     if (!message) return;

//     socket.emit("message", `<em style=" font-weight: bold;">${userName}:</em> ${message}`);
//     input.value = "";

// }

// Receive full chat history

socket.on("chatHistory", (messages) => {
    messages.forEach(renderMessage);
});

// Receive new message
socket.on("message", (msg) => {
    renderMessage(msg);
});

// Helpers

function renderMessage(msg) {
    const messagesDiv = document.getElementById("messages");
    const div = document.createElement("div");

    div.className = "message";

    // if (msg.type === "system") {
    //     div.classList.add("message system");
    //     div.textContent = msg.text;
    //     messagesDiv.appendChild(div);
    //     messagesDiv.scrollTop = messagesDiv.scrollHeight;
    //     return;
    // }

    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = `[${msg.time}] ◾ ${msg.user} (${msg.department})`;

    const body = document.createElement('div');
    body.className = 'message-body';

    // Text Message
    if (msg.type === 'text' && msg.text.trim() !== "") {
        // const textEl = document.createElement('p');
        // textEl.innerHTML = marked.parse(msg.text);
        // body.appendChild(textEl);

        let textPart = msg.text ? marked.parse(msg.text) : '';
        if (textPart) {
            body.innerHTML = textPart;
        }
    }

        // File Message
    else if (msg.type === 'file') {
        let textPart = msg.text ? marked.parse(msg.text) : '';
        if (textPart) {
            body.innerHTML = textPart + '<br>';
        }
        body.innerHTML += `<a href="${msg.filePath}" target="_blank">📎 ${msg.fileName}</a>`;
    }

        // Append header and body
        div.appendChild(header);
        div.appendChild(body);

        messagesDiv.appendChild(div);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function clearMessages() {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = '';
}

marked.setOptions({
    breaks: true,
    sanitize: true
});