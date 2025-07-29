require('dotenv').config();



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore=require('connect-mongo');

const { listingSchema } = require("./schema");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError");
const Listing = require("./models/listing");
const Review = require("./models/reviews");
const flash = require("connect-flash");


//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl =process.env.ATLASDB_URL;


const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");
const { isLoggedIn, isReviewAuthor } = require("./utils/middleware");
const userRoutes = require("./routes/user");

const { storage } = require("./cloudinary");
const multer = require("multer");
const upload = multer({ storage });





// Database connection
main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  //console.log("MongoDB URI:", dbUrl);
  await mongoose.connect(dbUrl);
}

// View engine & middleware
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const store= MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});




store.on("error" , ()=> {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOption = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};






app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// FLASH message middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Demo User 
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
    email: "student@gmail.com",
    username: "delta-student",
  });
  let registerdUser = await User.register(fakeUser, "helloworld");
  res.send(registerdUser);
});

// JOI validation middleware
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, msg);
  }
  next();
};

// Routes
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// INDEX
app.get("/listings", isLoggedIn, wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
}));

// NEW
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// CREATE


app.post(
  "/listings",
  isLoggedIn,
  upload.single("image"),
  validateListing,
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await newListing.save();
    req.flash("success", "New listing created successfully!");
    res.redirect(`/listings/${newListing._id}`);
  })
);


// SHOW
app.get("/listings/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
        select: "username"
      }
    });

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  res.render("listings/show", { listing });
}));

// EDIT
app.get("/listings/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { listing });
}));

// UPDATE

app.put(
  "/listings/:id",
  isLoggedIn,
  upload.single("image"),
  validateListing,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
      await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  })
);

// DELETE LISTING
app.delete("/listings/:id", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);

  if (!deletedListing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
}));



// REVIEW

app.post("/listings/:id/reviews", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  const { rating, comment } = req.body;

  const review = new Review({
    rating,
    comment,
    author: req.user._id
  });

  listing.reviews.push(review);
  await review.save();
  await listing.save();

  req.flash("success", "Review added.");
  res.redirect(`/listings/${id}`);
}));


// DELETE REVIEW
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted.");
  res.redirect(`/listings/${id}`);
}));

// Mount User Authentication Routes
app.use("/", userRoutes);

// 404 Handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { err });
});

// Start server
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
