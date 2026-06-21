import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    username: {
      type: String,
      required: true
    }
    ,
    email:{
        type: String,
        required: true
    },
    password: {
      type: String,
      required: true
    },
    contact:{
    type:String
    },
    address: {
     addressline1: String,
     addressline2: String,
     city: String,
     state: String,
     zip: String,
     country: String      
    }
    ,
      contact:{
 type: String
      }
},
{
    timestamps: true,
}
);



export default mongoose.models.User ||
  mongoose.model("User", userSchema);