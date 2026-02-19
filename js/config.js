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
    { id: "8x10-panel",      name: "8×10 Panel",           price: 120 },
    { id: "8x10-panel-gate", name: "8×10 Panel w/ Gate",   price: 150 },
    { id: "6x10-panel",      name: "6×10 Panel",           price: 105 },
    { id: "6x10-panel-gate", name: "6×10 Panel w/ Gate",   price: 135 },
    { id: "fence-base",      name: "Fence Base/Stand",      price: 20 },
    { id: "fence-clamp",     name: "Fence Clamp",           price: 3 },
    { id: "6x50-screen",     name: "6×50 Green Screen",     price: 50 },
    { id: "8x50-screen",     name: "8×50 Green Screen",     price: 58 },
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
      "6ft": { fence: 3.00, privacyScreen: 2.50 },
      "8ft": { fence: 3.99, privacyScreen: 3.00 },
    },

    barricadeRate: 2.00, // per LF

    concreteSurcharge: 1.50, // per LF
    gateWheelPrice: 40,      // each, rental charge
    sandbagPrice: 7,         // each, purchase (taxable)

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
