
const path = require("path");
const error_h = require("../middlewares/Error/error_class");
const Users = require("../models/user_model");
const jwt = require('jsonwebtoken');
const group_data_model = require("../models/group_model");
const bcrypt = require("bcryptjs");
const r_client = require("../middlewares/redis_client");

exports.get_room =  (req,res, next) => {
   try{
      const f_path = path.resolve(__dirname, "../views/html/room.html")
      res.sendFile(f_path);
   }
catch(e){
    return next(new error_h( "File is not found", 500));
}
}

exports.get_home =  (req,res, next) => {
   try{
      const f_path = path.resolve(__dirname, "../views/html/home.html")
      res.sendFile(f_path);
   }
catch(e){
    return next(new error_h( "File is not found", 500));
}
}

 exports.get_register =  (req,res) => {
    try{
        const f_path = path.resolve(__dirname, "../views/html/register.html")
        res.sendFile(f_path);
    }
 catch(e){
    return next(new error_h( "File is not found", 500));
 }
 }

 // Send the login page html
 exports.get_login =  (req,res,next) => {
    try{
      const f_path = path.resolve(__dirname, "../views/html/login.html")
      res.sendFile(f_path);
    }
 catch(e){
    return next(new error_h("File is not found", 500));
 }
  
 }

 // Verifying the login
exports.login = async(req,res,next) => {
   const {email, password} = req.body;
   try{ 
   const user = await Users.findOne({user_email: email});
   if(user){
      const hash_verify = await bcrypt.compare(password, user.user_password);
      if(hash_verify){
         const token = jwt.sign({u_id: user._id}, process.env.sessionKey, {expiresIn: '40m'});
         res.cookie("c_id", token, {expiresIn: '600000'});
         res.status(200).json({
            resp: "Successfully logged in"
         });
      }
      else{
         return next(new error_h("Wrong password", 400));
      }
   }
   else{
      return next(new error_h("Email Id is incorrect", 400));
   }
   }
   catch(e){
      return next(new error_h(`Error: ${e}`, 500));
   }

}


 // Sending the dashboard html
 exports.get_dash =  (req,res,next) => {
    try{
      const f_path = path.resolve(__dirname, "../views/html/dashboard.html")
      res.sendFile(f_path);
    }
 catch(e){
    return next(new error_h("File is not found", 500));
 }
 }

 // Getting the dashboard data

 exports.dash = async (req,res,next) => {
   try{
      const all_groups = await group_data_model.find();
      const all_users = await Users.find();
      const user_name = await Users.findById(res.locals.uid);
      const f_name = user_name.user_name;
      res.status(200).json({
          all_groups, all_users, f_name
      });
  }
  catch(e){
       return next(new error_h(`Error: ${e}`, 500));
  }  
 }

 exports.register = async (req,res,next) => {
      const { name, email, password } = req.body;
      let existingUser = await Users.findOne({ email });  
      if(existingUser){
         return next(new error_h("User with this id already exists", 400));
      }
      else{
         try{
          
            const hashedPassword = await bcrypt.hash(password, 8);
            const added_user = await Users.create({user_name: name, user_email: email, user_password: hashedPassword});
            res.status(200).json({
               resp: "Successfully registered"
            });
         }
      catch(e){
               return next(new error_h(`Error registering the user`, 500));
         }
      }
}

exports.make_group = async (req,res,next) => {
   const{group_title, group_description, group_max_size, group_entry_password} = req.body;
   
   try{
      const hash_pass = await bcrypt.hash(group_entry_password, 8);
      const create_group = await group_data_model.create({group_creator: res.locals.uid, group_title, group_description, group_max_size, group_entry_password: hash_pass, group_members: res.locals.uid});
      res.status(200).json({
         resp: "Successfully created"
      });
   }
   catch(e){
      return next(new error_h(`Error in creating the group: ${e}`, 500));
   }
}

exports.group_details = async (req,res,next) => {
   const {group_id} = req.body;
   try{
      const group = await group_data_model.findOne({_id: group_id}).select({group_description:1, group_title:1, group_creator:1, group_members:1, group_max_size:1, group_creation_date:1}).populate('group_members', 'user_name').populate("group_creator", "user_name").lean();
      group.group_members = group.group_members.map(mem => mem.user_name);
      group.group_creator = group.group_creator.user_name;
      res.status(200).json({
         resp: group
      });
   }
   catch(e){
      return next(new error_h(`Error: ${e}`, 500));
   }
}

exports.provide_entry = async (req,res,next) => {
   try{
      const {time_out} = req.body;
      const exist = await r_client.exists(`${res.locals.gid}:active_users`);
      if(exist){
         res.status(200).json({
            resp: res.locals.gid
          });
      }
      else{
         await r_client.set( `${res.locals.gid}:group_name`, res.locals.gtitle);
         await r_client.hmset( `${res.locals.gid}:active_users`, {'':''});
         await r_client.set(`${res.locals.gid}:group_size`, res.locals.size);
         await r_client.rpush(`${res.locals.gid}:chat-messages`, '');
         await r_client.expire(`${res.locals.gid}:group_name`, time_out*60);
         await r_client.expire(`${res.locals.gid}:group_size`, time_out*60);
         await r_client.expire(`${res.locals.gid}:active_users`, time_out*60);
         await r_client.expire(`${res.locals.gid}:chat-messages`, time_out*60);
         
         res.status(200).json({
            resp: res.locals.gid
         });
      }
   }
   catch(e){
       return next(new error_h(`Error: ${e}`, 500));
   }


}

exports.request = async(req,res, next) => {
   try{
      const {g_id} = req.body;
      const req_group = await group_data_model.find({_id: g_id}).lean();
      if(req_group.group_max_size === req_group.group_members.length){
          return next(new error_h("The group is already full"));
      }
      else{
         const all_data = await group_data_model.updateOne({_id: g_id}, {$push: {join_requests: res.locals.uid}});
         if(all_data.modifiedCount > 0){
            res.status(200).json({
               resp: "Requst sent successfully"
            });
         }
         else{
            return next(new error_h("Error sending the request", 500));
         }
      
      }
 
   }
   catch(e){
      return next(new error_h(`Error: ${e}`, 500));
   }
}

exports.persist_chat = async(req,res,next) => {
   try{
      const {mess,sender,c_id} = req.body;
      const c_exist = await r_client.exists(`${c_id}:chat-messages`);
      if(c_exist){
         const final_string = `${sender}: ${mess}`;
         const added_mess = await r_client.rpush(`${c_id}:chat-messages`, final_string);
         if(added_mess){
            res.status(200).json({
               resp: "set"
            });
         }
      }
      else{
         return next(new error_h("Room session might have expired",400))
      }
  
   }
   catch(e){
      return next(new error_h(`Room timed out`, 500));
   }
}

exports.get_chat = async(req,res,next) => {
   try{
      const {c_id} = req.body;
      const all_chats = await r_client.lrange(`${ c_id}:chat-messages`, 0, -1);
      res.status(200).json({
         resp: all_chats
      });
   }
   catch(e){
      return next(new error_h("Room might have expired", 500));
   }
}
exports.update_room = async(req,res,next) => {
   try{
      const {s_id, r_id} = req.body;
      const user = await Users.findOne({_id: res.locals.uid});
      if(user){
         const exist_data = await r_client.exists(`${r_id}:active_users`);
         if(exist_data){
            const add_active = await r_client.hsetnx(`${r_id}:active_users`, s_id, user.user_name);
            if(add_active){
               const members = await r_client.hgetall(`${r_id}:active_users`);
               const group_name  = await r_client.get(`${r_id}:group_name`);
               const group_size  = await r_client.get(`${r_id}:group_size`);
               const members_copy = { ...members };
               delete members_copy[s_id];
               res.status(200).json({
                  all_members: members_copy,
                  g_name: group_name,
                  g_size: group_size,
                  username: user.user_name
               });
            }
            else{
               return next(new error_h("Error saving to database", 500));
            }
         }
         else{
            return next(new error_h("Room has expired", 400));
         }
      
      }
      else{
         return next(new error_h("No user found with this id", 500));
      }
   }
   catch(e){
      return next(new error_h(`Error: ${e}`, 500));
   }
}

exports.clean = async(req,res,next) => {
   const {s_id, r_id} = req.body;
   const exist = await r_client.exists(`${r_id}:active_users`);
   if(exist){
      const del_result = await r_client.hdel(`${r_id}:active_users`, s_id);
      if(del_result === 1){
        res.status(200).json({
         resp: "cleaned"
        })
      }
      else{
         return next(new error_h("Not cleaned"));
      }
   }
}
