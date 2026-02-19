// ============================================================
// APP — Tab switching and initialization
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // Tab switching
  var tabs = document.querySelectorAll(".tab-bar .tab");
  var panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");

      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      panels.forEach(function (p) {
        p.classList.remove("active");
      });
      document.getElementById(target).classList.add("active");
    });
  });

  // Initialize estimators
  SalesEstimator.init();
  RentalEstimator.init();
  BarricadeEstimator.init();
});

// ============================================================
// Shared utility functions
// ============================================================

var Utils = {
  formatCurrency: function (amount) {
    return "$" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  roundUpToPanel: function (linearFeet) {
    return Math.ceil(linearFeet / CONFIG.rental.panelWidthFt) * CONFIG.rental.panelWidthFt;
  },

  panelCount: function (linearFeet) {
    return Math.ceil(linearFeet / CONFIG.rental.panelWidthFt);
  },

  getRadioValue: function (name) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : null;
  },

  calculateExtensionCharges: function (rentalSubtotal, durationMonths) {
    var baseMonths = CONFIG.rental.standardTermMonths;
    var extensionRate = CONFIG.rental.extensionRate;
    var yearCommitment = CONFIG.rental.yearCommitmentMonths;
    var freeMonths = CONFIG.rental.yearCommitmentFreeMonths;

    if (durationMonths <= baseMonths) {
      return { extensionTotal: 0, monthlyExtension: 0, extensionMonths: 0, isYearCommitment: false, label: "" };
    }

    var monthlyExtension = rentalSubtotal * extensionRate;
    var extensionMonths = durationMonths - baseMonths;
    var isYearCommitment = durationMonths === yearCommitment;

    var extensionTotal;
    if (isYearCommitment) {
      // 1-year commitment: pay for (extensionMonths - freeMonths)
      extensionTotal = monthlyExtension * (extensionMonths - freeMonths);
    } else {
      extensionTotal = monthlyExtension * extensionMonths;
    }

    return {
      extensionTotal: extensionTotal,
      monthlyExtension: monthlyExtension,
      extensionMonths: extensionMonths,
      isYearCommitment: isYearCommitment,
      label: isYearCommitment
        ? extensionMonths + " months extension (1 month free)"
        : extensionMonths + " month(s) extension @ 16%"
    };
  }
};
