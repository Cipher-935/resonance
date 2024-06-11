

document.addEventListener("DOMContentLoaded", () => {

    const e_form = document.querySelector(".enter_form");
    const m_frame = document.querySelector('.main_frame');
    const g_form = document.querySelector(".group_form");
    const btn_create = document.querySelector(".btn_create");
    const user_section = document.querySelector('.user_section');
    const group_section = document.querySelector('.group_section');
    const btn_make = document.querySelector('.btn_make');
    const btn_enter = document.querySelector(".b_enter");
    const group_card = document.querySelector(".group_details");


    async function show_dash(){
      const dash_data = await fetch("/dash_data");
      const all_data = await dash_data.json();
  
      // Making the greet message
      let greet = document.querySelector('.session_greet');
      greet.innerHTML = `Welcome back ${all_data.f_name}!`;

      // Populating all the site users
      all_data.all_users.forEach(user => {
            const user_div = document.createElement("div");
            const user_html = `<p>${user.user_name}</p><button class = 'btn_invite'>Invite</button>`;
            user_div.innerHTML = user_html;
            user_div.classList.add('user');
            user_section.appendChild(user_div);
        });

        // Populating the group section with the groups if present or set a custom message
      if(all_data.all_groups.length > 0){
        all_data.all_groups.forEach(group => {
            const ele = document.createElement("div");
            const ele_html = ` <p style="margin-left: 5px;">${group.group_title}</p>
                               <div class="group_btns">
                               <button class="btn_view" group-id = '${group._id}'>View</button>
                               <button class= 'btn_enter' group-id = '${group._id}'>Enter</button>
                               <button class="btn_join" group-id = ${group._id}>Join</button>
                               </div>`;
            ele.innerHTML = ele_html;
            ele.classList.add("group");
            group_section.appendChild(ele);
        });

        const all_view = document.querySelectorAll(".btn_view");

        all_view.forEach(btn => {
          btn.addEventListener("click", async(e) => {
              e.preventDefault();
              const g_id = btn.getAttribute("group-id");
              const view_desc = await fetch("/view-group", 
               {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify({group_id: g_id})
            });
              const view_resp = await view_desc.json();
              let mem_string = '';
              view_resp.resp.group_members.forEach(member => {
                console.log(member);
                mem_string += `<li>${member}</li>`
              })
              group_card.innerHTML = `    <label>Group Creator: ${view_resp.resp.group_creator.user_name}</label>
                                          <label>Group Title: ${view_resp.resp.group_tile}</label>
                                          <label>Group Description</label>
                                          <p>
                                          ${view_resp.resp.group_description}
                                          </p>
                                          <label>Group Members</label>
                                          <ul>
                                             ${mem_string}
                                          </ul>
                                          <label>Max Size: ${view_resp.resp.group_max_size}</label>
                                          <button class = 'btn_kill'>Close</button>`;
              m_frame.style.opacity = '0.1';
              group_card.style.display = 'flex';
              const btn_kill = document.querySelector('.btn_kill');
              btn_kill.addEventListener("click", (e) => {
                e.preventDefault();
                m_frame.style.opacity = '1';
                group_card.style.display = 'none';
              });
          });
        });

        const all_enter = document.querySelectorAll('.btn_enter');
        all_enter.forEach(btn => {
            btn.addEventListener("click", async (e) => {
              e.preventDefault();
              const g_id = btn.getAttribute("group-id");
              btn_enter.setAttribute("group-id", g_id);
              m_frame.style.opacity = '0.1';
              e_form.style.display = 'flex';
            });
        });

        const all_join = document.querySelectorAll(".btn_join");
        all_join.forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const group_id = btn.getAttribute("group-id");
            const added = await fetch("/request", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({g_id: group_id})});
            if(added.status === 200){
               const a_data = await added.json();
               alert(a_data.resp);
            }
            else{
              const a_data = await added.json();
              alert(a_data.resp);
            }
          });
      });

        btn_enter.addEventListener("click", async (e) => {
            const entered_pass = document.getElementById("entry_pass").value;
            const time_limit = document.getElementById("timeLimit");
            const id = btn_enter.getAttribute("group-id");  
            const send_verification = await fetch("/verify-entry", {
              method: "POST",
              headers: {"Content-Type": 'application/json'},
              body: JSON.stringify({pass: entered_pass, g_id: id, time_out: time_limit.value})
            });
            if(send_verification.status === 200){
                 const id = await send_verification.json();
                 window.location.href = `/room?id=${id.resp}`;
            }
            else{
              const v_resp = await send_verification.json();
              alert(v_resp.resp);
            }
        });
      }
      else{
        const alt_gmsg = document.createElement("h2");
        alt_gmsg.innerHTML = "No groups found";
        alt_gmsg.style.marginLeft = '10px';
        group_section.appendChild(alt_gmsg);
      }

      // For showing the create group modal window
      btn_create.addEventListener("click", async (e) => {
        e.preventDefault();
        const g_form = document.querySelector(".group_form");
        const m_frame = document.querySelector('.main_frame');
        m_frame.style.opacity = '0.1';
        g_form.style.display = 'flex';
       });
      
      btn_make.addEventListener('click', async (e) => {
          const g_title = document.getElementById("g_title");
          const g_description = document.getElementById("g_dec");
          const group_secret = document.getElementById("g_secret");
          const g_size = document.getElementById("g_size");
          const g_obj = {
              group_title: g_title.value,
              group_description: g_description.value,
              group_entry_password: group_secret.value,
              group_max_size: g_size.value
          };
          const make_group = await fetch("/make-group", {method: "POST", headers: {"Content-Type": 'application/json'}, body: JSON.stringify(g_obj)});
          const make_group_response = await make_group.json();
          alert(make_group_response.resp); 

      });

       // Listner for all the cancel buttons on the page to close or abort the modal windows or actions
       const cancel_btns = document.querySelectorAll(".btn_cancel");
       cancel_btns.forEach(btn => {
          btn.addEventListener("click", async (e) => {
           e.preventDefault();
           const btn_text = btn.textContent;
           if(btn_text === 'Abort'){
               e_form.style.display = 'none';
               m_frame.style.opacity = '1';
           }
           else if(btn_text === 'Cancel'){
         
               m_frame.style.opacity = '1';
               g_form.style.display = 'none';
           }
          
      });
   });

    }

    // Calling the dash_data method
    show_dash();
  
});