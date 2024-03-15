import mongoose,{Schema} from "mongoose";


const subscriptionSchema = new Schema(
    {
     subscriber:{
        type:Schema.Types.ObjectId,
        ref:"USer"
     },
     channal:{
        type:Schema.Types.ObjectId,
        ref:"USer"
     }
},{timestamps:true})


export const Subscription = mongoose.model("Subscription",subscriptionSchema);