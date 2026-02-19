// ============================================================
// DISTANCE — Haversine formula for zip code distance
// ============================================================

var Distance = {
  toRadians: function (deg) {
    return deg * (Math.PI / 180);
  },

  haversine: function (lat1, lon1, lat2, lon2) {
    var R = 3958.8; // Earth radius in miles
    var dLat = this.toRadians(lat2 - lat1);
    var dLon = this.toRadians(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  getMiles: function (customerZip) {
    var origin = ZIP_COORDS[CONFIG.originZip];
    var dest = ZIP_COORDS[customerZip];
    if (!origin || !dest) return null;
    var straightLine = this.haversine(origin[0], origin[1], dest[0], dest[1]);
    return Math.ceil(straightLine * CONFIG.roadDistanceMultiplier);
  },

  // Rental delivery: free within 30 miles, $9/mile beyond
  rentalDeliveryCost: function (customerZip) {
    var miles = this.getMiles(customerZip);
    if (miles === null) return { miles: null, cost: 0, error: true };
    var free = CONFIG.rental.delivery.freeRadiusMiles;
    var rate = CONFIG.rental.delivery.perMileRate;
    var billableMiles = Math.max(0, miles - free);
    return {
      miles: miles,
      cost: billableMiles * rate,
      billableMiles: billableMiles,
      free: miles <= free,
      error: false
    };
  },

  // Sales delivery: $9/mile full distance, free up to 60 miles if order > $5000
  salesDeliveryCost: function (customerZip, orderSubtotal) {
    var miles = this.getMiles(customerZip);
    if (miles === null) return { miles: null, cost: 0, error: true };
    var rate = CONFIG.salesDelivery.perMileRate;
    var freeMin = CONFIG.salesDelivery.freeDeliveryMinOrder;
    var freeMax = CONFIG.salesDelivery.freeDeliveryMaxMiles;

    if (orderSubtotal >= freeMin && miles <= freeMax) {
      return { miles: miles, cost: 0, free: true, error: false };
    }
    return {
      miles: miles,
      cost: miles * rate,
      free: false,
      error: false
    };
  }
};
