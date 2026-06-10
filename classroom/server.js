const express = require("express");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const fs = require("fs");

// ============================================================
// 🛠️ SMART ROUTE LOADER (Prevents Case-Sensitivity Crashes)
// ============================================================
let users, posts;

try {
  // Scenario 1: Try lowercase folder 'routes'
  if (fs.existsSync(path.join(__dirname, "routes"))) {
    users = fs.existsSync(path.join(__dirname, "routes", "user.js")) 
      ? require("./routes/user.js") 
      : require("./routes/User.js");

    posts = fs.existsSync(path.join(__dirname, "routes", "post.js")) 
      ? require("./routes/post.js") 
      : require("./routes/Post.js");
  } 
  // Scenario 2: Fallback to capitalized folder 'Routes'
  else {
    users = fs.existsSync(path.join(__dirname, "Routes", "user.js")) 
      ? require("./Routes/user.js") 
      : require("./Routes/User.js");

    posts = fs.existsSync(path.join(__dirname, "Routes", "post.js")) 
      ? require("./Routes/post.js") 
      : require("./Routes/Post.js");
  }
} catch (error) {
  console.error("Error loading routes dynamically:", error.message);
}

// ============================================================
// ⚙️ EXPRESS CONFIGURATION & MIDDLEWARE
// ============================================================
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretstring",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week expiration
  }
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(session(sessionOptions));
app.use(flash());

// Flash message middleware
app.use((req, res, next) => {
  res.locals.successMsg = req.flash("success");
  res.locals.errorMsg = req.flash("error");
  next();
});

// Register the imported routes
if (users) app.use("/users", users);
if (posts) app.use("/posts", posts);

// ============================================================
// 🛣️ CORE APPLICATION ROUTES
// ============================================================
app.get("/register", (req, res) => {
  let { name = "anonymous" } = req.query;
  req.session.name = name;
  
  if (name === "anonymous") {
    req.flash("error", "user not registered");
  } else {
    req.flash("success", "user registered successfully!");
  }
  
  console.log("Current Session User:", req.session.name);
  res.redirect("/hello");
});

app.get("/hello", (req, res) => {
  res.render("page.ejs", { name: req.session.name });
});

// ============================================================
// 🚀 DYNAMIC PORT FOR RENDER DEPLOYMENT
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server successfully listening on port ${PORT}`);
});
