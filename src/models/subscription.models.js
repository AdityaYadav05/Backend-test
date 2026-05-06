import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
subscriber : {
type : mongoose.Schema.types.ObjectId, // only who is subscribing
ref : "User"
},
channel : {
    type : mongoose.Schema.types.ObjectId, // only the channel which is being subscribed to 
    ref : "User"
} 
},
{timestamps: true})