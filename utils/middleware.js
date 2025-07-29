// middleware.js
const Review = require("../models/reviews");



module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // Save the URL they tried to access
    req.flash("error", "You must be logged in to access that page.");
    return res.redirect("/login");
  }
  next();
};



module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that.");
    return res.redirect("back");
  }
  next();
};
