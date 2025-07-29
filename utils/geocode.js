const axios = require('axios');

// Geocoding function using Nominatim (OpenStreetMap)
const geocodeLocation = async (location) => {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: location,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'WanderlustApp/1.0 (your@email.com)'
      }
    });

    if (res.data.length === 0) {
      throw new Error('Location not found');
    }

    const place = res.data[0];
    return {
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    };
  } catch (err) {
    console.error('Geocoding Error:', err.message);
    return null;
  }
};

module.exports = geocodeLocation;
