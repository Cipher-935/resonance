const mongoose = require("mongoose");
const group_schema = mongoose.Schema({

   group_creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'all_users',
      required: true
   },

   group_title: {
      type: String,
      required: true,
   },

   group_description: {
      type: String,
      required: true,
   },

   group_members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "all_users",
    default: [],
    required: true
   }],

   group_max_size: {
       type: Number,
       required: true
   },

   group_entry_password: {
       type: String,
       required: true
   },

   group_creation_date: {
     type: Date,
     default: Date.now(),
     required: true
   },

   join_requests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "all_users",
      default: []
   }]
});

const group_data_model = mongoose.model("all_groups", group_schema);
module.exports = group_data_model;
