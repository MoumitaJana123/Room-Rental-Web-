require("./models/booking");
if(process.env.NODE_ENV != "production"){
   require('dotenv').config();
}
const express=require("express");
const app=express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");

const session=require("express-session");
const flash = require("connect-flash");
const passport=require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter= require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter= require("./routes/user.js");
const bookingRoutes = require("./routes/booking");
app.use("/bookings", bookingRoutes);


app.use(express.static(path.join(__dirname, "public")));
const MONGO_URL ="mongodb://127.0.0.1:27017/rental";




const Listing=require("./models/listing.js");
main().then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
    
}
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

const sessionOptions = {
    secret:"mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge:7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    },
};



const validateListing= (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

//basic api create
// app.get("/",(req,res) =>{
//    res.send("Hi, I am root");
// });
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
//add test

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser= req.user || null;
    
    next();
});
// app.get("/demouser", async(req,res)=>{
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username:"delta-student"
//     });

//     let registeredUser=await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// });






app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);






//Index Route 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
}));
//new route

app.get("/listings/new",(req,res) =>{
   res.render("listings/new.ejs"); 
});
//show route
  app.get("/listings/:id",wrapAsync(async(req,res) => {
    let{id} = req.params;
    const listing = await Listing.findById(id)
  .populate("reviews")
  .populate("owner");
  res.render("listings/show.ejs", {listing});
}));
//create Route
app.post("/listings",wrapAsync(async(req,res) =>{ 

    
    const newListing=new Listing(req.body.listing);
     await newListing.save();
     res.redirect("/listings");

}));
//Edit Route
app.get("/listings/:id/edit",wrapAsync(async (req,res) =>  {
     let{id} = req.params;
  const listing=await Listing.findById(id);
  res.render("listings/edit.ejs",{ listing });


}));
//update route
app.put("/listings/:id", validateListing,wrapAsync(async (req, res) => {
    let { id } = req.params;

    await Listing.findByIdAndUpdate(id, {
        ...req.body.listing,
        image: {
            url: req.body.listing.image.url
        }
    });

    res.redirect(`/listings/${id}`);
}));

//delete route
app.delete("/listings/:id", wrapAsync(async(req,res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));


app.use((req, res) => {
    res.status(404).send("Page Not Found!");
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs",{message});
   // res.status(statusCode).send(message);
});
app.use((req, res, next) => {
    res.locals.currUser = req.user;
    next();
});
app.listen(8080, () =>{
    console.log("server is litening to port 8080 ");
});
