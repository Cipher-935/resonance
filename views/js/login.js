document.addEventListener("DOMContentLoaded", () => {
    
    const btn_login = document.getElementById("btn_login");
    const s_mess = document.querySelector('.server_msg');

    btn_login.addEventListener("click", async (e) => {
        e.preventDefault();
        btn_login.disabled = true;
        const user_email = document.getElementById("u_email").value;
        const user_pass = document.getElementById("u_pass").value;

        const d_obj = {
            email: user_email, password: user_pass
        };

        const send_log = await fetch("/login", {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(d_obj)
        });
        if(send_log.status === 200){
            window.location.href = "/dash";
        }
        else{
            const r_dat = await send_log.json();
            s_mess.innerHTML = r_dat.resp;
            s_mess.style.display = 'block'
            setTimeout(function(){
                s_mess.textContent = '';
                s_mess.style.display = 'none';
                btn_login.disabled = false;
            }, 2000);
        }
    });
});