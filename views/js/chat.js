document.addEventListener("DOMContentLoaded", () => {
    
const socket = io();
const g_msg = document.querySelector('.greet_msg');
const c_box = document.querySelector('.active_chats');
const make_greet = (msg) => {
    g_msg.textContent = msg;
    g_msg.style.display = 'flex';
    setTimeout(function(){
        g_msg.textContent = '';
        g_msg.style.display = 'none';
    }, 4000);
}

const add_message = (msg) => {
    const element = document.createElement('div');
    element.innerHTML = `<p>${msg}</p>`;
    
    c_box.appendChild(element);
}

const notify_new = (msg) => {
   g_msg.textContent = msg;
   g_msg.style.display = 'flex';
   setTimeout(function(){
    g_msg.textContent = '';
    g_msg.style.display = 'none';
   },4000);
}

const send_message = document.querySelector('.btn_send');

send_message.addEventListener('click', (e) => {
    e.preventDefault();
    const mess_input = document.querySelector('.user_message').value;
    if(mess_input.trim() != ''){
        socket.emit('clientMessage', mess_input);
    }
    else{
        alert('Message Cannot be empty');
    }
});


socket.on('admin_greet', (msg) => {
  make_greet(msg);
});

socket.on('new_user', (msg) => {
    notify_new(msg);
});

socket.on('user_dis', (dis_mess) => {
    g_msg.textContent = msg;
    g_msg.style.display = 'flex';
    setTimeout(function(){
     g_msg.textContent = '';
     g_msg.style.display = 'none';
    },4000);
});

socket.on('receiveMessage', (msg) => {
    add_message(msg);
});

});


