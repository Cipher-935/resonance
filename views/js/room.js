
document.addEventListener("DOMContentLoaded", () => {
   var my_id = '';
   const r_socket = io();
   r_socket.on('connect', () => {
      my_id = r_socket.id;
      render_data(r_socket.id);
    });
    // Now, r_socket.id will be defined
   var rtcObj; // RtcPeer connection object
   var mediaStream; // Media recorder object
   var recorded_chunks; // Array to store the recorded video
   var userStream; // Camera stream that will change to camera or the screen media as per the options

   // video display frame elements
   const u_frame = document.getElementById('userVideo'); 
   const p_frame = document.getElementById('peerVideo'); 
   const u_div = document.querySelector('.u_div');
   
   // All button elements
   const record = document.querySelector('.btn_record');
   const down = document.querySelector('.btn_download');
   const screen_share = document.querySelector('.btn_share');
   const mute = document.getElementById("mute_btn");
   const leave_room = document.getElementById("btn_leave");
   const hide_camera = document.getElementById("hide_cam");
   const call_options = document.querySelector('.record_options');
   const active_users = document.querySelector(".active_users");
   const video_frames = document.querySelector(".video_frames");
   const m_window = document.querySelector(".main_window");
   const send_btn = document.getElementById("btn_send");
   const user_mess = document.getElementById("user_mess");
   const chat_box = document.querySelector(".all_chats");
   const no_chats = document.getElementById("empty");
   const holder = document.querySelector('.holder');
   const invite_div = document.querySelector(".invitation");
   const u_holder = document.querySelector(".user_holder");
   var room_id = '';
   var f_name = '';

   function render_users(final_data){
      f_name = final_data.username;
      const u_data = Object.entries(final_data.all_members);
      if(u_data.length < 2){    
          u_holder.style.display = 'flex';
      }
      else{
         u_data.forEach(([key,val]) => {
            if(key != ''){
               let user_div = document.createElement("div");
               user_div.innerHTML = `<h3 style = 'margin-left:5px;'>${val}</h3><button class = 'btn_call' peer-id=${key}>Video Call</button>`;
               user_div.classList.add('user');
               user_div.id = key;
               active_users.appendChild(user_div);
            }
         });
      }
 


      holder.innerHTML =  `Welcome to ${final_data.g_name}`;
      holder.style.display = 'flex';
      const all_call = document.querySelectorAll(".btn_call");
      all_call.forEach(btn => {
          btn.addEventListener("click", async (e) => {
              const peer_id = btn.getAttribute("peer-id"); 
              initiate_call(peer_id);
             
         });
      });
   }
   
   function render_chats(chats){
      // THis is to render the chats inside the chat-container
      chats.forEach(ele => {
         if(ele === ''){
            console.log();
         }
         else{
            no_chats.style.display = 'none';
            let chat_ele = document.createElement("div");
            chat_ele.innerHTML = `<h3 style="margin-left: 10px;font-weight: bolder;">${ele}</h3>`;
            chat_ele.classList.add("msg-container");
            chat_box.appendChild(chat_ele);
         }
      });
   }

   const fetch_chats = async () => {
      // Get the saved chats from redis
      no_chats.style.display = 'flex';
      const all_chats = await fetch("/get-chats", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({c_id: room_id})});
      if(all_chats.status === 200){
         const c_data = await all_chats.json();
         if(c_data.resp.length > 0){
            render_chats(c_data.resp);
         }
         else{
            no_chats.style.display = 'flex';
         }
   }
}

   const render_data =  async (soc) => {
   // Get the room id from the href or search string
   try{
      const currentURL = window.location.href;
      const urlParams = new URLSearchParams(currentURL.split('?')[1]);
      room_id = urlParams.get('id');
      const update_room = await fetch("/update-room", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({s_id: soc, r_id: room_id})});
      if(update_room.status === 200){
         const final_data = await update_room.json();
         render_users(final_data);
         await fetch_chats();
         r_socket.emit('joinRoom', {r_id: room_id, user: final_data.username, group_size: final_data.g_size});
      }
      else{
         const data = await update_room.json();
         alert(data.resp);
      }
   }
   catch(e){
       alert(`Error: ${e}`);
   }

}
send_btn.addEventListener("click", async (e) => {
   e.preventDefault();
   const save_chat = await fetch("/persist-chat", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({mess: user_mess.value, c_id: room_id, sender: "Jay"})});
   if(save_chat.status === 200){
      r_socket.emit("room_msg", {r_id: room_id, r_mess: `${f_name}: ${user_mess.value}`});
   }
   else{
      const response = await save_chat.json();
      alert(response.resp);
   }
});

   // This function will be called when the user presses the record button
   async function record_media(){
      const dis_media = await navigator.mediaDevices.getDisplayMedia({video: true});
      recorded_chunks = []; // Clearing array to start a fresh recording all the time
      const options = {
         mime: "video/webm"  // Options for setting the mime of the data like audio or video
       };
   
      mediaStream = new MediaRecorder(dis_media, options); // making the recorder object with the options and the acitve user media stream
   
      mediaStream.ondataavailable = (event) => { // This will handle all the data during the recording that is to push it inside the array
         if(event.data.size > 0){
             recorded_chunks.push(event.data);
         }
         else{
            console.log("No data");
         }
      };
      mediaStream.onstop = () => { // This will be called when the user stops the recording
         alert("Recording stopped");
      }
mediaStream.onerror = () => {
   alert("Error with the recorder");
}

      mediaStream.start(); // Starting the recorder
   }

   // Downloads the video from the values inside the recorder_chunks array using blobs and url objects
   function download_recorded_media(){
      try{
         const r_data = new Blob(recorded_chunks, {type: "video/webm"}); // Setting mime of the blobs raw data obtained from the array
         const url = URL.createObjectURL(r_data);
         const a = document.createElement('a');
         a.style.display = 'none';
         a.href = url;
         a.download = 'recorded_session.webm'; // Setting downlaoded video file name
         document.body.appendChild(a);
         a.click();   // For automated download
         URL.revokeObjectURL(url); // Clearing the blob object after successful download
      }
      catch(e){
         console.log("Error: " + e);
      }
   
   }
   
   // Function to mute the voice on the client side
   mute.addEventListener("click", (e) => {
      e.preventDefault();
      if(mute.innerHTML === '<i class="fas fa-microphone"></i>'){
         try{
            console.log(userStream.getTracks()[0].enabled);
            userStream.getTracks()[0].enabled = false;
            mute.innerHTML = '<i class="fas fa-microphone-slash"></i>';
         }
         catch(e){
            console.log("No video stream");
         }
      }
      else{
         try{
            userStream.getTracks()[0].enabled = true;
            mute.innerHTML = '<i class="fas fa-microphone"></i>';
         }
         catch(e){
            console.log("No video stream");
         }
      }
   });
   
   //Function to hide the camera
   hide_camera.addEventListener("click", (e) => {
      e.preventDefault();
      if(hide_camera.innerHTML === '<i class="fas fa-video"></i>'){
         try{
      
            userStream.getTracks()[1].enabled = false;
            hide_camera.innerHTML = '<i class="fas fa-video-slash"></i>';
         }
         catch(e){
            console.log("No video stream");
         }
      }
      else{
         try{
            userStream.getTracks()[1].enabled = true;
            hide_camera.innerHTML = '<i class="fas fa-video"></i>';
         }
         catch(e){
            console.log("No video stream");
         }
      }
   });
   
   function stop_recording() {
      try {
         if (mediaStream && mediaStream.state !== 'inactive') {
            mediaStream.stop(); // Stop the recorder if it's active
            alert("Recording stopped");
         }
      } catch (error) {
         console.error("Error stopping recording:", error);
      }
   }
   
   record.addEventListener('click', async (e) => { // Listner for the record button press
       e.preventDefault();
       if(record.innerHTML === '<i class="fas fa-circle"></i>'){
          record.innerHTML = '<i class="fas fa-square"></i>';
          down.disabled = true;
          down.classList.add("btn-dis"); // Disabling the download while the recording is on
          await record_media();
       }
       else{
          stop_recording();
          record.innerHTML = '<i class="fas fa-circle"></i>';
          down.disabled = false;       // Enabling the download when the recording has stopped.
          down.classList.remove("btn-dis");
       }
   });
   
   // donwload media listener for the button
   down.addEventListener("click", (e) => {
      e.preventDefault();
      download_recorded_media();
   });
   
   
   // Function to stop the current userstream and than replacing it with the passed stream used for screensharing
   function replaceStream(stream) {
      if (userStream) { 
         userStream.getTracks().forEach(track => { // Stopping the audio and the video of the current stream
            track.stop();
         });
         userStream = stream;
         u_frame.srcObject = userStream;
         r_socket.emit('ready', f_name);
         userStream.getVideoTracks()[0].addEventListener('ended', () => { // If I press the provided stop share button
            userStream.getTracks().forEach(track => {
               track.stop();
            });
            show_video(); // Starting the camera back using the show_video method
         });
      }
   }
   
   // Listner for screenshare button
   screen_share.addEventListener("click", async (e) => {
      e.preventDefault();
      const s_data = await navigator.mediaDevices.getDisplayMedia({
         audio: true,
         video: true
      });
      replaceStream(s_data);
      
   });
   
   // Starting the camera and seting up the call features
   const show_video = async (p_id) => {
      try{
         userStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
         });
         u_frame.srcObject = userStream;
         u_div.style.display = 'flex';
         await u_frame.play();
     }
     catch(e){
       alert("Error : " + e);
     }
   }
   
   // Function for exchanging the candidates
   function OnCandidate(event){
      if(event.candidate){
         r_socket.emit("candidate", event.candidate, room_id);
      }
      else{
         console.log("The ice candidate was not found");
      }
   }
   
   // Ice server list
   var iceServers = {
      iceServers: [
         { urls: 'stun:stun.services.mozilla.com' },
         { urls: 'stun:stun.l.google.com:19302' },
         { urls: 'stun:stun2.l.google.com:19302' },
         { urls: 'stun:stun3.l.google.com:19302' }
      ]
   };

   async function initiate_call(pid){
      m_window.style.opacity = '0.1';
      video_frames.style.display = "flex";
      call_options.style.display = 'flex';
      await show_video();

      const rtcObj = new RTCPeerConnection(iceServers);
      rtcObj.onicecandidate = OnCandidate;


      userStream.getTracks().forEach(track => {
         rtcObj.addTrack(track, userStream);
      });

      rtcObj.addEventListener("track", async(e) => {
         p_frame.style.display = 'flex';
         try{
            p_frame.srcObject = e.streams[0];
            await p_frame.play();
         }
         catch(e){
            console.log("Already playing");
         }
      });

      const offer = await rtcObj.createOffer();
      await rtcObj.setLocalDescription(offer);
      r_socket.emit("offer", {offer: rtcObj.localDescription, r_id: room_id, username: f_name, s_id: my_id, rec_id: pid});
}
   
   leave_room.addEventListener("click", (e) => {
     e.preventDefault();
    //r_socket.emit("leave", room_id);
     if(u_frame.srcObject){
       u_frame.srcObject.getTracks()[0].stop();
       u_frame.srcObject.getTracks()[1].stop();
       u_frame.srcObject = null;
       u_div.style.display = 'none';
     }
     if(p_frame.srcObject){
         p_frame.srcObject.getTracks()[0].stop();
         p_frame.srcObject.getTracks()[1].stop();
         p_frame.srcObject = null;
         p_frame.style.display = 'none';
     }
     if(rtcObj){
      try{
         rtcObj.onicecandidate = null;
         rtcObj.ontrack = null;
         rtcObj.close();
      }
      catch(e){
        console.log();
      }
     
     }
     m_window.style.opacity = '1';
     video_frames.style.display = 'none';
   });
   
   // This is to show the show you a welcome messgae and start your camera
   
   // This is to notify other users that you have joined the room
   r_socket.on('notify_room', (msg) =>{
      if(u_holder.style.display === 'flex'){
           u_holder.style.display = "none";
      }
      const user = document.createElement("div");
      user.innerHTML = `<h2>${msg.p_name}</h2><button class = 'btn_call' peer-id=${msg.sid}>Video Call</button>`;
      user.classList.add("user");
      user.id = msg.sid;
      active_users.appendChild(user);
      alert(msg.mess);
      const all_call = document.querySelectorAll(".btn_call");
      all_call.forEach(btn => {
          btn.addEventListener("click", async (e) => {
              const peer_id = btn.getAttribute("peer-id"); 
              initiate_call(peer_id);
             
         });
      });
   });

   // This is to notify if the peer has left the chat
   r_socket.on("leave", () => {
   
      if(p_frame.srcObject){
         p_frame.srcObject.getTracks()[0].stop();
         p_frame.srcObject.getTracks()[1].stop();
         p_frame.style.display = 'none';
         alert("The peer left the chat");
        
     }
     if(rtcObj){
        try{
         rtcObj.onicecandidate = null;
         rtcObj.ontrack = null;
         rtcObj.close();
        }
        catch(e){
          console.log("");
        }
  
     }
      
   });
   
   // This is to receive the remote offers and than create the answers for it
   r_socket.on("offer", async (offerObj) => {
      if (offerObj.receiver === my_id) {
         invite_div.innerHTML = `<h2>${offerObj.user} is initiating a video call</h2>
                                 <div class = 'offer_options'>
                                 <button class='accept'>Accept</button>
                                 <button class='reject'>Reject</button>
                                 </div>`;
         const a_btn = document.querySelector(".accept");
         const r_btn = document.querySelector(".reject");
   
         a_btn.addEventListener("click", async (e) => {
            e.preventDefault();
            video_frames.style.display = 'flex';
            m_window.style.opacity = '0.4';
            show_video();
            rtcObj = new RTCPeerConnection(iceServers);
            rtcObj.onicecandidate = OnCandidate;
   
            userStream.getTracks().forEach(track => {
               rtcObj.addTrack(track, userStream);
            });
   
            rtcObj.addEventListener("track", async (e) => {
               p_frame.style.display = 'flex';
               try {
                  p_frame.srcObject = e.streams[0];
                  await p_frame.play();
               } catch (e) {
                  console.log("Already playing");
               }
            });
   
            try {
               await rtcObj.setRemoteDescription(offerObj.offer);
               const answer = await rtcObj.createAnswer();
               await rtcObj.setLocalDescription(answer);
               r_socket.emit("answer", { answer: rtcObj.localDescription, r_id: room_id, s_id: offerObj.sender }); // Emitting the answer after setting local description
            } catch (error) {
               console.error("Error creating offer:", error);
            }
         });
   
         r_btn.addEventListener("click", (e) => {
            e.preventDefault();
            invite_div.style.display = 'none';
            m_window.style.opacity = "1";
            r_socket.emit("rejectedCall", {msss: `Your call was rejected by ${f_name}`, sid: offerObj.sender, r_id: room_id});
         });
         m_window.style.opacity = "0.1";
         invite_div.style.display = "flex";
      }
   });
   
   // This is to receive the remote peers answer
   r_socket.on("answer", async (ansObj) => {
      if(ansObj.meant === my_id){
         await rtcObj.setRemoteDescription(answer);
      }
   });

   r_socket.on("rec_msg", (msg) => {
         
         no_chats.style.display = 'none';
         const chat_ele = document.createElement("div");
         chat_ele.innerHTML = `<h3 style="margin-left: 10px;font-weight: bolder;">${msg}</h3>`;
         chat_ele.classList.add("msg-container");
         chat_box.appendChild(chat_ele);
   });
   
   // This is to receive the peers ice candidates
   r_socket.on("candidate", (can) => {
      try{
         var new_can = new RTCIceCandidate(can);
         rtcObj.addIceCandidate(new_can);
      }
      catch(e){
        console.log();
      }
 
   });
   
   // Fires when there is a error from the server side due to room capacity
   r_socket.on('joinError', (msg) => {
      alert(msg);
   });

   r_socket.on("user_dis", (obj) => {
       alert(`${obj.msg}`);
       const delete_div = document.getElementById(`${obj.u_id}`);
       delete_div.remove();
       if(active_users.childElementCount === 1){
          console.log("Found dis");
          u_holder.style.display = "flex";
       }
   });

   r_socket.on("rejectedCall", (msg_obj) => {
      if(msg_obj.s_id === my_id){
         alert("Your call was rejected");
      }
   });

   });