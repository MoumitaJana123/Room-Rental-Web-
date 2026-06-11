const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// CREATE BOOKING
router.post("/", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body.booking;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // --- CALCULATION LOGIC ---
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    
    const timeDiff = d2.getTime() - d1.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (days <= 0) {
        req.flash("error", "Check-out date must be after check-in!");
        return res.redirect(`/listings/${id}`);
    }

    const totalPrice = days * listing.price;

    // --- NEW BOOKING OBJECT ---
    const newBooking = new Booking({
        listing: id,
        user: req.user._id, // Matches your Schema's required 'user' field
        checkIn: d1,
        checkOut: d2,
        totalPrice: totalPrice
    });

    // 1. Save the booking to the database
    await newBooking.save();

    // 2. Link this booking to the Listing's bookings array
    listing.bookings.push(newBooking._id);
    await listing.save();

    req.flash("success", `Booking successful! Total: ₹${totalPrice.toLocaleString("en-IN")}`);
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
