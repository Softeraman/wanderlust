const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

// ✅ GET: Signup Form
router.get("/signup", (req, res) => {
  res.render("users/signup");
});

// ✅ POST: Signup Form Submission
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});

// ✅ GET: Login Form
router.get("/login", (req, res) => {
  res.render("users/login");
});

// ✅ POST: Login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);

// ✅ GET: Logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "You have logged out successfully.");
    res.redirect("/login");
  });
});

module.exports = router;
