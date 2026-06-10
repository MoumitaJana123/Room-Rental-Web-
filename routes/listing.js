const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

// =======================
// INDEX + CREATE
// =======================
router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
   
    upload.single("image"),
     validateListing,
    wrapAsync(listingController.createListing)
);


// =======================
// NEW FORM
// =======================
router.get("/new", isLoggedIn, listingController.renderNewForm);
//search functionality
router.get("/search", wrapAsync(listingController.searchListings));

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
