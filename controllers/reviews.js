const Listing = require("../models/listing");
const Review = require("../models/review");

// 1. CREATE REVIEW: Saves a comment and updates the listing array references
module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

// 2. DESTROY REVIEW: Fixes nested declaration and runs clean $pull logic
module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    
    // Pull the review ID from the listing object array
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    // Remove the standalone document from the reviews collection
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review Deleted");
    res.redirect(`/listings/${id}`);
};
