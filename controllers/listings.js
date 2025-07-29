const Listing = require("../models/listing");
const geocodeLocation = require('../utils/geocode');

// Create Listing
module.exports.createListing = async (req, res) => {
  const listing = new Listing(req.body.listing);

  // Geocode the location
  const geoData = await geocodeLocation(req.body.listing.location);
  if (geoData) {
    listing.geometry = {
      type: 'Point',
      coordinates: [geoData.lng, geoData.lat], // GeoJSON format
    };
  }

  // Upload image if present
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else {
    // Set default image if not uploaded
    listing.image = {
      url: "https://img.icons8.com/?size=100&id=j1UxMbqzPi7n&format=png&color=000000",
      filename: "default"
    };
  }

  await listing.save();
  req.flash("success", "New listing created successfully!");
  res.redirect(`/listings/${listing._id}`);
};

// Update Listing
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  // Re-geocode location if updated
  if (req.body.listing.location) {
    const geoData = await geocodeLocation(req.body.listing.location);
    if (geoData) {
      listing.geometry = {
        type: 'Point',
        coordinates: [geoData.lng, geoData.lat]
      };
    }
  }

  // Upload new image if provided
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else if (!listing.image || !listing.image.url) {
    // Set default image only if no image exists yet
    listing.image = {
      url: "https://via.placeholder.com/800x600?text=No+Image+Found",
      filename: "default"
    };
  }

  await listing.save();
  req.flash("success", "Listing updated successfully!");
  res.redirect(`/listings/${listing._id}`);
};
