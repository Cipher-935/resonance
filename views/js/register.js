document.addEventListener("DOMContentLoaded", () => {

    const btn_register = document.getElementById("btn_register");
    const s_mess = document.querySelector('.server_msg');
    btn_register.addEventListener("click", async (e) => {
        e.preventDefault();
        btn_register.disabled = true;
        const username = document.getElementById("u_input").value;
        const user_email = document.getElementById("u_email").value;
        const user_pass = document.getElementById("u_pass").value;

        const d_obj = {
            name: username, email:user_email, password: user_pass
        };

        const send_reg = await fetch("/register", {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(d_obj)
        });
        
        const r_dat = await send_reg.json();
        s_mess.innerHTML = r_dat.resp;
        s_mess.style.display = 'block'
        setTimeout(function(){
            s_mess.textContent = '';
            s_mess.style.display = 'none';
            btn_register.disabled = false;
        }, 2000);
        


    });
});