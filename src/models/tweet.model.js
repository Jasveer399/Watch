import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    contant: {
      type: String,
      required: [true, "Please provide a content for the Tweet"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
