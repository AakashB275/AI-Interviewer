const mongoose = require('mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/trainmeai");

const userSchema = mongoose.Schema({
    userName : String,
    email: String,
    password : String,
    contact : Number,
})

module.exports = mongoose.model("user", userSchema);