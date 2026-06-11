const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// =======================
// INDEX + CREATE
// =======================
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        isOwner, // ✅ FIXED: removed isHost
        upload.single("image"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// =======================
// NEW FORM
// =======================
router.get(
    "/new",
    isLoggedIn,
    isOwner, // ✅ FIXED
    listingController.renderNewForm
);

// Search functionality
router.get("/search", wrapAsync(listingController.searchListings));

// =======================
// BOOKING ROUTE
// =======================
router.post("/:id/bookings", isLoggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    let { checkIn, checkOut } = req.body.booking;

    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);

    const diffTime = d2 - d1;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (days <= 0 || isNaN(days)) {
        req.flash("error", "Invalid dates! Checkout must be after Checkin.");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = days * listing.price;

    const newBooking = new Booking({
        listing: id,
        user: req.user._id,
        checkIn: d1,
        checkOut: d2,
        totalPrice: totalPrice,
    });

    await newBooking.save();

    listing.bookings.push(newBooking._id);
    await listing.save();

    req.flash(
        "success",
        `Booking confirmed for ${days} days! Total: ₹${totalPrice.toLocaleString("en-IN")}`
    );

    res.redirect(`/listings/${id}`);
}));

// =======================
// SHOW + UPDATE + DELETE
// =======================
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        upload.single("image"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

// =======================
// EDIT FORM
// =======================
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
