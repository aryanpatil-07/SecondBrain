const mongoose=require('mongoose');

const noteSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    tags:[String],
    createdAt:{
        type:Date,
        default:Date.now
    },   
},{timestamps:true});

module.exports=mongoose.model('Note',noteSchema);