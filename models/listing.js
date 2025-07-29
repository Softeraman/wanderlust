const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const reviews=require("./reviews");
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: String,
    url: {
      type: String
    },
  },
  price: Number,
  location: String,
  country: String,

   // ✅ New field for geolocation (GeoJSON format)
  geometry: {
    type: {
      type: String, // "Point"
      enum: ['Point'],
       default:'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    }
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

// deleteing reviews from databases too

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await reviews.deleteMany({
      _id: { $in: listing.reviews }
    });
  }
});


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
