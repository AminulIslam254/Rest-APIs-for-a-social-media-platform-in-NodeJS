const mongoose=require('mongoose');

exports.connectMongoose=()=>{
    mongoose
        .connect("mongodb://localhost:27017/Social_media")
        .then((e)=>console.log(`Database connected at ${e.connection.host}`))
        .catch((e)=>console.log(e));
};

const userschema= new mongoose.Schema({
    email:String,
    password:String,
    no_of_followers:Array,
    no_of_followings:Array,
    token:String,
    
});

exports.User=mongoose.model("user_frames",userschema);