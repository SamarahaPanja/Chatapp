

function createConnection() {


}
const socket = io();
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("message");
const allMessages = document.getElementById("messages");
const roomContainer = document.getElementById("room-container");

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const fileStatus = document.getElementById('fileStatus');

const videoCallBtn = document.getElementById('videoCall');

if (msgInput != null) {
    const name = prompt("What is your name?");
    const p = document.createElement("p");
    p.innerText = 'You Joined';
    allMessages.appendChild(p);
    socket.emit('new-user', roomName, name)
    
    sendBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const message = msgInput.value;
        socket.emit("sendMessage", roomName, message);
        msgInput.value = "";
    });
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent any default behavior if necessary
        const file = fileInput.files[0]; // Get the selected file
        if (!file) {
            console.log("No file selected");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const buffer = new Uint8Array(reader.result);
            console.log("File content as buffer:", buffer);

            // Send the file data to the server
            // socket.emit("upload-file", {
            //     fileName: file.name,
            //     fileData: buffer
            // });
            let el = document.createElement("div");
            el.classList.add("item")
            el.innerHTML = `
                <div class="progress">0%</div>
                <div class="file-name">${file.name}</div>
                <button class="download>Download</button>
            `;
            allMessages.appendChild(el);
            shareFile({
                fileName: file.name,
                total_buffer_size: buffer.length,
                buffer_size: 1024
            }, buffer, el.querySelector(".progress"));

        };
        reader.readAsArrayBuffer(file);
    });

    videoCallBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = `/video/${roomName}`;
    });
}

function shareFile(metadata, buffer, progress_node) {
    console.log("started file share");
    socket.emit("file-meta", {
        metadata: metadata,
        room: roomName
    })
    console.log("meta data sent");
    socket.on("fs-share-sender", () => {
        let chunk = buffer.slice(0, metadata.buffer_size);
        buffer = buffer.slice(metadata.buffer_size, buffer.length);
        progress_node.innerText = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100) + "%";
        console.log("sending actual data", chunk.length, buffer.length);
        if (chunk.length != 0) {
            socket.emit("file-raw", {
                room: roomName,
                buffer: chunk
            })
        }
    })
}

socket.on('room-created', (room) => {
    if (roomContainer) {
        const roomElement = document.createElement("div");
        roomElement.innerText = room;
        const roomLink = document.createElement("a");
        roomLink.innerText = 'Join';
        roomLink.href = `/${room}`;
        roomContainer.append(roomElement);
        roomContainer.append(roomLink);
    }

})

socket.on('user-connected', (name) => {
    //console.log(name+' joined the chat')
    const p = document.createElement("p");
    p.innerText = `${name} joined the chat`;
    allMessages.appendChild(p);
});

socket.on('user-disconnected', (name) => {
    const p = document.createElement("p");
    p.innerText = `${name} left the chat`;
    allMessages.appendChild(p);
});

socket.on('message', (data) => {
    console.log(data.message)
    const p = document.createElement("p");
    p.innerText = `${data.name} : ${data.message}`
    allMessages.appendChild(p);
})

let fileshare = {}
socket.on("fs-meta", (metadata) => {
    console.log("received file meta data", metadata);
    fileshare.metadata = metadata
    fileshare.transmitted = 0
    fileshare.buffer = []

    let el = document.createElement("div");
    el.classList.add("item")
    el.innerHTML = `
                <div class="progress">0%</div>
                <div class="file-name">${metadata.fileName}</div>
            `;
    allMessages.appendChild(el);
    fileshare.progress_node = el.querySelector(".progress")
    socket.emit("fs-start", {
        room: roomName
    })
    console.log("requesting actual data");
})

socket.on("fs-share", (buffer) => {
    console.log(fileshare)
    fileshare.buffer.push(buffer)
    fileshare.transmitted += buffer.byteLength;
    fileshare.progress_node.innerText = Math.trunc(fileshare.transmitted / fileshare.metadata.total_buffer_size * 100) + "%";
    if (fileshare.transmitted == fileshare.metadata.total_buffer_size) {
        download(new Blob(fileshare.buffer), fileshare.metadata.fileName);
        fileshare = {};
    }
    else {
        socket.emit("fs-start", {
            room: roomName
        })
    }
})
