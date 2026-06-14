import mongoose from "mongoose";

const AuctionSchema = new mongoose.Schema(
  {
    owner:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    bids:[
      {
        bidder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        amount: {
          type: Number
        },
      }
    ],
    buyer:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    finalPrice: {
      type: Number
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    startingPrice: {
      type: Number,
      required: true,
      min:1
    },

    category: {
      type: String,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    packageDetails: {
      weight: {
        type: Number,
        required: true,
        min: 0.1,
        max: 50,
      },

      length: {
        type: Number,
        required: true,
        max: 60,
      },

      width: {
        type: Number,
        required: true,
        max: 30,
      },

      height: {
        type: Number,
        required: true,
        max: 30,
      },
    },
  },
  {
    timestamps: true,
  }
);



export default mongoose.models.Auction ||
  mongoose.model("Auction", AuctionSchema);