const express = require("express");
const app = express();
const http = require("http");
const app_server = http.createServer(app);
const ioSocket = require("socket.io");
const io = ioSocket(app_server);
const path = require("path");
const app_router = require("./routes/app_routes");
const error_handler = require("./middlewares/Error/error_handler");
const e_class = require("./middlewares/Error/error_class");
const parser = require("cookie-parser");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require("axios");
dotenv.config({path: 'config.env'});
app.use(express.static(path.join(__dirname, "views")));
app.use(express.json());
app.use(parser());
io.on("connection", (socket) => {

    // The universal chat room listners
  
    socket.emit('admin_greet', "Welcome to the universal chat room!");

    socket.broadcast.emit("new_user", "A new user got connected");

    socket.on('clientMessage', (msg) => {
        io.emit('receiveMessage', msg);
    });

    // Room based video calling
    socket.on('joinRoom', async (roomDetails) => 
    {
        const num_rooms = io.sockets.adapter.rooms; // List of available rooms
        const r_room = num_rooms.get(roomDetails.r_id); // Getting the requested room
        if(r_room === undefined || r_room.size < roomDetails.group_size){
            socket.join(roomDetails.r_id);
            socket.roomID = roomDetails.r_id;
            socket.broadcast.in(roomDetails.r_id).emit("notify_room", {mess:`${roomDetails.user} has joined the chat`, p_name: roomDetails.user, sid: socket.id});
        }
        else{
            socket.emit("joinError", "The room is already full!");
        }
    });

    socket.on("room_msg", (msgDetails) => {
        io.in(msgDetails.r_id).emit("rec_msg", msgDetails.r_mess);
    });


    socket.on("candidate", (candidate, roomName) => {
         
         socket.broadcast.in(roomName).emit("candidate", candidate);
    });

    socket.on("offer", (offerDetails) => {
        socket.broadcast.in(offerDetails.r_id).emit("offer", {offer: offerDetails.offer, user: offerDetails.username, sender: offerDetails.s_id, receiver: offerDetails.rec_id} );
    });
     
    socket.on('answer', (answerObj) => { 
        console.log("Answer back to me: ", answerObj.s_id);
        socket.broadcast.in(answerObj.r_id).emit("answer", {answer: answerObj.answer, meant: answerObj.s_id});
    });

    // socket.on("leave", (roomName) => {
    //     socket.leave(roomName);
    //     socket.broadcast.in(roomName).emit("leave");
    //  });

     socket.on("rejectedCall", (obj) => {
        socket.broadcast.in(obj.r_id).emit("rejectedCall", {s_id: obj.sid, msg: obj.mess});
     })

     
    // Standard disconnect for all the sockets
    socket.on('disconnect', async () => {
        const del_user = await axios.post("http://127.0.0.1:4000/cleanup", {s_id: socket.id, r_id: socket.roomID});
        if(del_user.status === 200){
            socket.broadcast.in(socket.roomID).emit("user_dis", {msg:  "A user has disconnected", u_id: socket.id});
        }
        else{
           console.log("Not cleaned");
           socket.broadcast.in(socket.roomID).emit("user_dis", {msg: `${socket.id} has left the room`, u_id: socket.id});
        }
    });
});

// Using the epresss router
app.use("/", app_router);

app.use(error_handler);

app_server.listen(4000, () => {
   console.log("App sevrer started");
});

mongoose.connect(process.env.CONN_STRNG,{useNewUrlParser: true}).then((conn) =>{
    console.log("Database connection successful");
});

