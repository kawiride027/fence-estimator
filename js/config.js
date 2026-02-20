// ============================================================
// FENCE DEPARTMENT PRICE ESTIMATOR — CONFIGURATION
// Update prices, rates, and thresholds here.
// ============================================================

const CONFIG = {
  companyName: "Fence Department",
  originZip: "91342", // Sylmar, CA
  salesTaxRate: 0.095, // 9.5%

  // ---- SALES PRODUCTS ----
  salesProducts: [
    { id: "8x10-panel",      name: "8×10 Panel",                    price: 120 },
    { id: "8x10-panel-gate", name: "8×10 Panel w/ Pedestrian Gate", price: 150 },
    { id: "6x10-panel",      name: "6×10 Panel",                    price: 105 },
    { id: "6x10-panel-gate", name: "6×10 Panel w/ Pedestrian Gate", price: 135 },
    { id: "fence-base",      name: "Fence Base/Stand",               price: 20 },
    { id: "fence-clamp",     name: "Fence Clamp",                    price: 3 },
    { id: "fence-post",      name: "Purchasing Post",                price: 45 },
    { id: "6x50-screen",     name: "6×50 Green Screen",              price: 50 },
    { id: "8x50-screen",     name: "8×50 Green Screen",              price: 58 },
  ],

  salesVolumeDiscounts: [
    { threshold: 10000, discount: 0.20 },
    { threshold: 6000,  discount: 0.15 },
    { threshold: 3000,  discount: 0.10 },
  ],

  salesDelivery: {
    perMileRate: 9,
    freeDeliveryMinOrder: 5000,
    freeDeliveryMaxMiles: 60,
  },

  // ---- RENTAL PRICING ----
  rental: {
    panelWidthFt: 10,
    minimumRentalPrice: 950,
    standardTermMonths: 6,
    billingCycleDays: 28,
    extensionRate: 0.16, // 16% of rental subtotal per month
    yearCommitmentMonths: 12,
    yearCommitmentFreeMonths: 1, // 1 month free on 12-month commitment

    rates: {
      "6ft": { fence: 3.50, privacyScreen: 3.00 },
      "8ft": { fence: 4.50, privacyScreen: 4.00 },
    },

    barricadeRate: 2.00, // per LF (legacy — replaced by barricadePrice)
    barricadePrice: 15,       // per barricade unit
    barricadeLengthFt: 7.5,   // each barricade is 7.5ft long
    minimumMonthlyExtension: 94.35, // floor for monthly extension charge

    concreteSurcharge: 1.50, // per LF (drilling for in-ground on concrete)
    inGroundPostPrice: 20,   // per post
    postsPerPanel: 2,        // typically 2 posts per panel

    // Gate rental fees (wheel included free on all gates)
    gates: {
      vehicleStandard: 125,   // 10ft or 12ft wide
      vehicleDoubleWide: 175, // 20ft wide
      pedestrian: 75,
    },

    sandbagPrice: 7.95, // each, purchase (taxable)

    sandbagRecommendations: {
      "6ft": { withPrivacy: [1, 2], withoutPrivacy: [0, 1] },
      "8ft": { withPrivacy: [2, 4], withoutPrivacy: [1, 2] },
    },

    delivery: {
      freeRadiusMiles: 30,
      perMileRate: 9,
    },
  },

  // ---- DISTANCE CALCULATION ----
  roadDistanceMultiplier: 1.3,
};
