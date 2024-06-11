const mongoose = require('mongoose');

const user_shcema = new mongoose.Schema(
{
    user_name:
    {
        type: String,
        required: true,
        unique: true
    },
    user_email:
    {
        type: String,
        unique: true,
        required: true
    },
    user_password:
    {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('all_users', user_shcema);