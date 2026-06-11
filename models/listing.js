

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js"); // Keeps the single correct reference

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: {
      type: String,
      default: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3",
      // Handles empty string submissions from frontend forms
      set: (v) => v === "" ? "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3" : v,
    },
    filename: {
      type: String,
      default: "listingimage",
    }
  },
  price: {
    type: Number,
    min: [0, "Price cannot be negative!"],
  },
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

// Cascade delete: Automatically removes matching reviews from the DB when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing && listing.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
