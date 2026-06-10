//require("./models/booking.js");
if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cors = require("cors"); // ✅ Added CORS support for frontend connectivity
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
//const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRoutes = require("./routes/booking.js");

// ============================================================
// 🌱 DATABASE CONNECTION (Connects to MongoDB Atlas / Local)
// ============================================================
// ✅ Uses Render environment variable or falls back to local database
const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/rental";

//const Listing = require("./models/listing.js");
main().then(() => {
    console.log("Connected to MongoDB Atlas successfully! 🌱");
}).catch(err => {
    console.error("Database Connection Error: ❌", err.message);
});

async function main() {
    await mongoose.connect(MONGO_URL);
}

// ============================================================
// ⚙️ EXPRESS CONFIGURATION & MIDDLEWARE
// ============================================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors()); // ✅ Enabled CORS
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // ✅ Added to handle JSON payloads from your frontend fetch requests
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

const sessionOptions = {
    secret: process.env.SESSION_SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// ============================================================
// 🛣️ ROUTE REGISTRATION
// ============================================================
app.use("/bookings", bookingRoutes);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ✅ Root Redirect: Automatically takes visitors directly to listings
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Index Route 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}));

// New Route
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs"); 
});

// Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("reviews")
        .populate("owner");
    res.render("listings/show.ejs", { listing });
}));

// Create Route
app.post("/listings", wrapAsync(async (req, res) => { 
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

// Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
}));

// Update Route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, {
        ...req.body.listing,
        image: {
            url: req.body.listing.image.url
        }
    });
    res.redirect(`/listings/${id}`);
}));

// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// ============================================================
// 🚨 ERROR HANDLING MIDDLEWARES
// ============================================================
app.use((req, res) => {
    res.status(404).send("Page Not Found!");
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { message });
});

// ============================================================
// 🚀 DYNAMIC PORT FOR RENDER DEPLOYMENT
// ============================================================
// ✅ Dynamically reads Render's target environment port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server successfully listening on port ${PORT}`);
});
