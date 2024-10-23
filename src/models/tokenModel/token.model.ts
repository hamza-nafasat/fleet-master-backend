import mongoose from "mongoose";

// token schema
const tokenSchema = new mongoose.Schema({

    token: {type:String, required:true}

},{timestamps: true})


export const Token = mongoose.model("Token", tokenSchema);