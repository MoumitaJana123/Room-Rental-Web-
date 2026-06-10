if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cors = require("cors");

const ExpressError = require("./utils/ExpressError");
const { listingSchema } = require("./schema");

// Models
const User = require("./models/user");
const Listing = require("./models/listing");

// Routes
const listingRouter = require("./routes/listing");
const reviewsRouter = require("./routes/review");
const userRouter = require("./routes/user");
const bookingRoutes = require("./routes/booking");

// Session & Auth
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// ======================================================
// DATABASE CONNECTION
// ======================================================

const MONGO_URL =
    process.env.ATLASDB_URL ||
    "mongodb://127.0.0.1:27017/rental";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log("MongoDB Connected Successfully");
    })
    .catch((err) => {
        console.log("MongoDB Error:", err);
    });

// ======================================================
// VIEW ENGINE
// ======================================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// SESSION STORE
// ======================================================

const store = MongoStore.create({
    mongoUrl: MONGO_URL,
});

store.on("error", (err) => {
    console.log("SESSION STORE ERROR", err);
});

const sessionOptions = {
    store,
    secret: process.env.SESSION_SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// ======================================================
// PASSPORT CONFIG
// ======================================================

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy(User.authenticate())
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ======================================================
// GLOBAL VARIABLES
// ======================================================

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// ======================================================
// VALIDATION
// ======================================================

const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const errMsg = error.details
            .map((el) => el.message)
            .join(",");

        throw new ExpressError(400, errMsg);
    }

    next();
};

// ======================================================
// ROUTES
// ======================================================

app.use("/bookings", bookingRoutes);

app.use("/listings", listingRouter);

app.use(
    "/listings/:id/reviews",
    reviewsRouter
);

app.use("/", userRouter);

// Root Redirect

app.get("/", (req, res) => {
    res.redirect("/listings");
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
    const {
        statusCode = 500,
        message = "Something went wrong",
    } = err;

    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode).render("error.ejs", {
        message,
    });
});

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});
