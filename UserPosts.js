const mongoose=require('mongoose');



const userschema= new mongoose.Schema({
    title:String,
    description:String,
    createdTime:Date,
    email:String,
    likes:Array,
    comments:Array
});

exports.UserPosts=mongoose.model("user_Posts",userschema);