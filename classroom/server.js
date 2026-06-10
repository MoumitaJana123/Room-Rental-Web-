const express = require("express");
const app = express();
const users = require("./classroom/routes/user.js");
const posts = require("./classroom/routes/post.js");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretstring", // Use env variable in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // Best practice: explicit cookie expiration (1 week)
  }
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Standard middleware
app.use(express.urlencoded({ extended: true })); // Added in case you process form inputs
app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

// Routes
app.get("/register", (req, res) => {
  let { name = "anonymous" } = req.query;
  req.session.name = name;
  
  if (name === "anonymous") {
    req.flash("error", "user not registered");
  } else {
    req.flash("success", "user registered successfully!");
  }
  
  console.log(req.session.name);
  res.redirect("/hello");
});

app.get("/hello", (req, res) => {
  res.render("page.ejs", { name: req.session.name });
});

// USE DYNAMIC PORT FOR DEPLOYMENT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
