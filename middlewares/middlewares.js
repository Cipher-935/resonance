
const jwt = require("jsonwebtoken");
const error_h = require("../middlewares/Error/error_class");
const group_data_model = require("../models/group_model");
const bcrypt = require("bcryptjs");
exports.check_login = async (req,res,next) => {
  const cookie = req.cookies.c_id;

  if(!cookie){
     return next(new error_h("Please log in first", 400))
  }
  else{
    try{ 
      const verify =  jwt.verify(cookie, process.env.sessionKey);
      res.locals.uid = verify.u_id
      next();
    }
    catch(e){
      return next(new error_h("Please log in", 400));
    }
  }
}

exports.sanitize_signup = async (req,res,next) => {
  const {name, email, password} = req.body;
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,12}$/;
  if((name.trim() === '' || name.length > 12) || email.trim() === '' || !regex.test(password.trim())){
      return next(new error_h("Invalid or empty fields", 400));
  }
  else{
      next();
  }
}

exports.sanitize_login = async (req,res,next) => {
  const {email, password} = req.body;
  if((password.trim() === '' || password.length > 12) || email.trim() === ''){
      return next(new error_h("Invalid or empty fields", 400));
  }
  else{
      next();
  }
}

exports.check_query = async (req,res,next) => {
  const q_ID = req.query.id;
  if(!q_ID){
    return next(new error_h("Room id required", 400));
  }
  else{
    next();
  }
}

exports.verify_entry = async (req,res,next) =>{
try{ 
      const {pass, g_id} = req.body;
      const verify_group = await group_data_model.findOne({_id: g_id});
      const isMember = verify_group.group_members.some(mem => mem.toString() === res.locals.uid);
        if(verify_group && isMember){
              const verify_pass = await bcrypt.compare(pass, verify_group.group_entry_password);
              if(verify_pass){
                 res.locals.gid = g_id;
                 res.locals.size = verify_group.group_max_size;
                 res.locals.gtitle = verify_group.group_title;
                 next();   
              }
              else{
                 return next(new error_h("The password is not correct", 400));
              }
        }
        else{
          return next(new error_h("You are not a member of this group", 400));
        }   
}
catch(e){
  return next(new error_h(`Error: ${e}`, 500));
}
}

exports.authorized = async (req,res,next) => {
  try{
    const q_id = req.query.id;
    let group;
    if(q_id){
      group = await group_data_model.findOne({_id: q_id});
    }
    else{
      const {r_id} = req.body;
      group = await group_data_model.findOne({_id: r_id});
    }
    if(group){
      const isMember = group.group_members.some(mem => mem.toString() === res.locals.uid);
      if(isMember){
        next();
      }
      else{
        return next(new error_h("Unauthorized"));
      }
    }
    else{
      return next(new error_h("Group error", 400));
    }
  }
  catch(e){
    return next(new error_h(`Error: ${e}`, 500));
  }
}
