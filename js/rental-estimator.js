// ============================================================
// RENTAL ESTIMATOR — Fence Rental tab (8-step progressive form)
// ============================================================

var RentalEstimator = {
  init: function () {
    this.bindEvents();
  },

  // ---- EVENT BINDING ----

  bindEvents: function () {
    var self = this;

    // Step 1: Coverage
    document.getElementById("rental-linear-feet").addEventListener("input", function () {
      self.checkStep1();
      self.recalculate();
    });
    document.querySelectorAll('input[name="rental-site-type"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.checkStep1();
        self.recalculate();
      });
    });

    // Step 2: Height
    document.querySelectorAll('input[name="rental-height"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.unlockStep(3);
        self.resetStepsFrom(4); // height affects privacy screen pricing and sandbags
        self.recalculate();
      });
    });

    // Step 3: Surface
    document.querySelectorAll('input[name="rental-surface"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.handleSurfaceChange();
        self.recalculate();
      });
    });
    document.querySelectorAll('input[name="rental-install-type"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.unlockStep(4);
        self.recalculate();
      });
    });

    // Step 4: Privacy
    document.querySelectorAll('input[name="rental-privacy"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.handlePrivacyChange();
        self.recalculate();
      });
    });
    document.querySelectorAll('input[name="rental-privacy-color"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.unlockStep(5);
        self.recalculate();
      });
    });

    // Step 5: Gates
    document.querySelectorAll('input[name="rental-vehicle-gate"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var show = r.value === "yes" && r.checked;
        document.getElementById("rental-vehicle-wheel-group").classList.toggle("hidden", !show);
        if (!show) document.getElementById("rental-vehicle-wheel").checked = false;
        self.checkStep5();
        self.recalculate();
      });
    });
    document.querySelectorAll('input[name="rental-ped-gate"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var show = r.value === "yes" && r.checked;
        document.getElementById("rental-ped-wheel-group").classList.toggle("hidden", !show);
        if (!show) document.getElementById("rental-ped-wheel").checked = false;
        self.checkStep5();
        self.recalculate();
      });
    });
    document.getElementById("rental-vehicle-wheel").addEventListener("change", function () { self.recalculate(); });
    document.getElementById("rental-ped-wheel").addEventListener("change", function () { self.recalculate(); });

    // Step 6: Sandbags
    document.getElementById("rental-sandbag-qty").addEventListener("input", function () {
      // Mark as manually edited so auto-fill doesn't overwrite
      this.setAttribute("data-auto-filled", "false");
      self.unlockStep(7);
      self.recalculate();
    });

    // Step 7: Duration
    document.getElementById("rental-duration").addEventListener("change", function () {
      self.unlockStep(8);
      self.recalculate();
    });

    // Step 8: Delivery
    document.getElementById("rental-zip").addEventListener("input", function () {
      self.recalculate();
    });
  },

  // ---- STEP PROGRESSION ----

  checkStep1: function () {
    var feet = parseInt(document.getElementById("rental-linear-feet").value);
    var siteType = Utils.getRadioValue("rental-site-type");
    if (feet > 0 && siteType) {
      this.unlockStep(2);
    }
  },

  handleSurfaceChange: function () {
    var surface = Utils.getRadioValue("rental-surface");
    var installGroup = document.getElementById("rental-install-type-group");

    if (surface === "dirt") {
      installGroup.classList.remove("hidden");
      // Don't auto-unlock step 4 — wait for install type selection
    } else if (surface === "concrete") {
      installGroup.classList.add("hidden");
      // Auto-select above-ground and clear any in-ground selection
      document.querySelectorAll('input[name="rental-install-type"]').forEach(function (r) {
        r.checked = r.value === "above-ground";
      });
      this.unlockStep(4);
    }
  },

  handlePrivacyChange: function () {
    var privacy = Utils.getRadioValue("rental-privacy");
    var colorGroup = document.getElementById("rental-privacy-color-group");

    if (privacy === "yes") {
      colorGroup.classList.remove("hidden");
      // Wait for color selection before unlocking step 5
    } else {
      colorGroup.classList.add("hidden");
      // Clear color selection
      document.querySelectorAll('input[name="rental-privacy-color"]').forEach(function (r) { r.checked = false; });
      this.unlockStep(5);
    }
  },

  checkStep5: function () {
    var vehicle = Utils.getRadioValue("rental-vehicle-gate");
    var ped = Utils.getRadioValue("rental-ped-gate");
    if (vehicle && ped) {
      this.unlockStep(6);
      this.updateSandbagRecommendation();
    }
  },

  updateSandbagRecommendation: function () {
    var height = Utils.getRadioValue("rental-height");
    var privacy = Utils.getRadioValue("rental-privacy");
    var linearFeet = parseInt(document.getElementById("rental-linear-feet").value) || 0;
    var panels = Utils.panelCount(linearFeet);

    if (!height || panels === 0) return;

    var key = privacy === "yes" ? "withPrivacy" : "withoutPrivacy";
    var range = CONFIG.rental.sandbagRecommendations[height][key];
    var min = panels * range[0];
    var max = panels * range[1];

    var recEl = document.getElementById("rental-sandbag-recommendation");
    recEl.textContent = "Recommended: " + min + "–" + max + " sandbags (" + panels + " panels × " + range[0] + "–" + range[1] + " each)";

    // Pre-fill with upper bound if not manually edited
    var qtyInput = document.getElementById("rental-sandbag-qty");
    if (qtyInput.getAttribute("data-auto-filled") !== "false") {
      qtyInput.value = max;
      qtyInput.setAttribute("data-auto-filled", "true");
      // Auto-unlock next steps since sandbag has a value
      this.unlockStep(7);
      this.unlockStep(8); // Duration has a default, so unlock delivery too
    }
  },

  unlockStep: function (stepNum) {
    var step = document.getElementById("rental-step-" + stepNum);
    if (!step) return;
    if (step.classList.contains("locked")) {
      step.classList.remove("locked");
      step.classList.add("active");
      // Mark previous step as completed
      var prevStep = document.getElementById("rental-step-" + (stepNum - 1));
      if (prevStep) prevStep.classList.add("completed");
      // Smooth scroll to the latest newly-unlocked step only
      var self = this;
      clearTimeout(this._scrollTimer);
      this._scrollTimer = setTimeout(function () {
        step.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  },

  resetStepsFrom: function (stepNum) {
    for (var i = stepNum; i <= 8; i++) {
      var step = document.getElementById("rental-step-" + i);
      if (!step) continue;
      if (!step.classList.contains("locked")) {
        step.classList.add("locked");
        step.classList.remove("active", "completed");
      }
    }
  },

  // ---- RECALCULATE ----

  recalculate: function () {
    var linearFeet = parseInt(document.getElementById("rental-linear-feet").value) || 0;
    var height = Utils.getRadioValue("rental-height");
    var surface = Utils.getRadioValue("rental-surface");
    var installType = Utils.getRadioValue("rental-install-type");
    var privacy = Utils.getRadioValue("rental-privacy");
    var vehicleGate = Utils.getRadioValue("rental-vehicle-gate");
    var pedGate = Utils.getRadioValue("rental-ped-gate");
    var vehicleWheel = document.getElementById("rental-vehicle-wheel").checked;
    var pedWheel = document.getElementById("rental-ped-wheel").checked;
    var sandbagQty = parseInt(document.getElementById("rental-sandbag-qty").value) || 0;
    var duration = parseInt(document.getElementById("rental-duration").value) || 6;
    var zip = document.getElementById("rental-zip").value.trim();

    if (linearFeet <= 0 || !height) {
      this.renderSummary(null);
      return;
    }

    var roundedFeet = Utils.roundUpToPanel(linearFeet);
    var rates = CONFIG.rental.rates[height];

    // Fence cost (rounded footage)
    var fenceCost = roundedFeet * rates.fence;

    // Concrete surcharge (on rounded footage since panels are installed)
    var concreteSurcharge = surface === "concrete" ? roundedFeet * CONFIG.rental.concreteSurcharge : 0;

    // Gate wheels
    var wheelCount = 0;
    if (vehicleGate === "yes" && vehicleWheel) wheelCount++;
    if (pedGate === "yes" && pedWheel) wheelCount++;
    var wheelCost = wheelCount * CONFIG.rental.gateWheelPrice;

    // Delivery
    var delivery = { miles: null, cost: 0, free: false, error: false };
    var deliveryInfo = document.getElementById("rental-delivery-info");
    if (zip.length === 5) {
      delivery = Distance.rentalDeliveryCost(zip);
      if (delivery.error) {
        deliveryInfo.textContent = "Zip code not in our delivery area — please call for a quote.";
        deliveryInfo.style.color = "var(--error)";
      } else if (delivery.free) {
        deliveryInfo.textContent = delivery.miles + " miles — Free delivery (within " + CONFIG.rental.delivery.freeRadiusMiles + " mi)";
        deliveryInfo.style.color = "var(--accent)";
      } else {
        deliveryInfo.textContent = delivery.miles + " miles — " + delivery.billableMiles + " mi beyond " + CONFIG.rental.delivery.freeRadiusMiles + " mi × $" + CONFIG.rental.delivery.perMileRate + "/mi = " + Utils.formatCurrency(delivery.cost);
        deliveryInfo.style.color = "var(--text-muted)";
      }
    } else {
      deliveryInfo.textContent = "";
    }

    // Rental subtotal (for minimum check and extension calc)
    var rentalSubtotal = fenceCost + concreteSurcharge + wheelCost + delivery.cost;
    var minimumApplied = false;
    if (rentalSubtotal < CONFIG.rental.minimumRentalPrice) {
      minimumApplied = true;
      rentalSubtotal = CONFIG.rental.minimumRentalPrice;
    }

    // Extension charges
    var ext = Utils.calculateExtensionCharges(rentalSubtotal, duration);

    // Purchase charges (privacy screen + sandbags — taxable)
    var privacyScreenCost = 0;
    if (privacy === "yes") {
      privacyScreenCost = linearFeet * rates.privacyScreen; // actual feet, no rounding
    }
    var sandbagCost = sandbagQty * CONFIG.rental.sandbagPrice;
    var purchaseSubtotal = privacyScreenCost + sandbagCost;
    var purchaseTax = purchaseSubtotal * CONFIG.salesTaxRate;
    var purchaseTotal = purchaseSubtotal + purchaseTax;

    // Grand total
    var grandTotal = rentalSubtotal + ext.extensionTotal + purchaseTotal;

    this.renderSummary({
      linearFeet: linearFeet,
      roundedFeet: roundedFeet,
      height: height,
      surface: surface,
      installType: installType,
      rates: rates,
      fenceCost: fenceCost,
      concreteSurcharge: concreteSurcharge,
      wheelCount: wheelCount,
      wheelCost: wheelCost,
      delivery: delivery,
      rentalSubtotal: rentalSubtotal,
      minimumApplied: minimumApplied,
      ext: ext,
      privacy: privacy,
      privacyScreenCost: privacyScreenCost,
      sandbagQty: sandbagQty,
      sandbagCost: sandbagCost,
      purchaseSubtotal: purchaseSubtotal,
      purchaseTax: purchaseTax,
      purchaseTotal: purchaseTotal,
      grandTotal: grandTotal,
      duration: duration
    });
  },

  // ---- RENDER SUMMARY ----

  renderSummary: function (data) {
    var el = document.getElementById("rental-summary-content");
    if (!data) {
      el.innerHTML = '<p class="empty-state">Fill in the steps above to see your estimate.</p>';
      return;
    }

    var html = "";

    // Rental charges
    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Rental Charges (6-month base)</div>';
    html += '<div class="summary-line"><span class="label">Fence <small>' + data.roundedFeet + " LF of " + data.height + " @ " + Utils.formatCurrency(data.rates.fence) + '/LF</small></span><span class="value">' + Utils.formatCurrency(data.fenceCost) + "</span></div>";

    if (data.concreteSurcharge > 0) {
      html += '<div class="summary-line"><span class="label">Concrete surcharge <small>' + data.roundedFeet + " LF @ $1.50/LF</small></span><span class=\"value\">" + Utils.formatCurrency(data.concreteSurcharge) + "</span></div>";
    }

    if (data.wheelCost > 0) {
      html += '<div class="summary-line"><span class="label">Gate wheel(s) <small>' + data.wheelCount + ' × $40</small></span><span class="value">' + Utils.formatCurrency(data.wheelCost) + "</span></div>";
    }

    if (data.delivery.miles !== null && !data.delivery.error) {
      if (data.delivery.free) {
        html += '<div class="summary-line"><span class="label">Delivery <small>' + data.delivery.miles + ' mi</small><span class="summary-badge badge-free">Free</span></span><span class="value">$0.00</span></div>';
      } else {
        html += '<div class="summary-line"><span class="label">Delivery <small>' + data.delivery.billableMiles + " mi × $" + CONFIG.rental.delivery.perMileRate + '/mi</small></span><span class="value">' + Utils.formatCurrency(data.delivery.cost) + "</span></div>";
      }
    }

    html += '<hr class="summary-divider">';
    html += '<div class="summary-line"><span class="label"><strong>Rental Subtotal</strong>';
    if (data.minimumApplied) {
      html += '<span class="summary-badge badge-min">Min $950 applied</span>';
    }
    html += '</span><span class="value"><strong>' + Utils.formatCurrency(data.rentalSubtotal) + "</strong></span></div>";
    html += "</div>";

    // Extension charges
    if (data.ext.extensionMonths > 0) {
      html += '<div class="summary-section">';
      html += '<div class="summary-section-title">Extension Charges</div>';
      if (data.ext.isYearCommitment) {
        html += '<div class="summary-line"><span class="label">' + data.ext.extensionMonths + " months extension <small>(1 month free)</small>" + '<span class="summary-badge badge-discount">1-Yr Commitment</span></span><span class="value">' + Utils.formatCurrency(data.ext.extensionTotal) + "</span></div>";
      } else {
        html += '<div class="summary-line"><span class="label">' + data.ext.extensionMonths + " month(s) @ 16% <small>" + Utils.formatCurrency(data.ext.monthlyExtension) + '/mo</small></span><span class="value">' + Utils.formatCurrency(data.ext.extensionTotal) + "</span></div>";
      }
      html += "</div>";
    }

    // Purchase charges
    if (data.purchaseSubtotal > 0) {
      html += '<div class="summary-section">';
      html += '<div class="summary-section-title">Purchase Charges (one-time, taxable)</div>';

      if (data.privacyScreenCost > 0) {
        html += '<div class="summary-line"><span class="label">Privacy screen <small>' + data.linearFeet + " LF @ " + Utils.formatCurrency(data.rates.privacyScreen) + '/LF</small></span><span class="value">' + Utils.formatCurrency(data.privacyScreenCost) + "</span></div>";
      }
      if (data.sandbagCost > 0) {
        html += '<div class="summary-line"><span class="label">Sandbags <small>' + data.sandbagQty + " × $7.00</small></span><span class=\"value\">" + Utils.formatCurrency(data.sandbagCost) + "</span></div>";
      }
      html += '<div class="summary-line"><span class="label">Sales Tax (9.5%)</span><span class="value">' + Utils.formatCurrency(data.purchaseTax) + "</span></div>";
      html += '<hr class="summary-divider">';
      html += '<div class="summary-line"><span class="label"><strong>Purchase Total</strong></span><span class="value"><strong>' + Utils.formatCurrency(data.purchaseTotal) + "</strong></span></div>";
      html += "</div>";
    }

    // Grand total
    html += '<hr class="summary-divider">';
    html += '<div class="summary-total"><span>Estimated Total</span><span>' + Utils.formatCurrency(data.grandTotal) + "</span></div>";

    // Extension rate note
    if (data.duration <= 6) {
      html += '<div class="summary-note info">Monthly extension rate after 6 months: ' + Utils.formatCurrency(data.rentalSubtotal * CONFIG.rental.extensionRate) + "/mo (16% of rental)</div>";
    }

    // Dig Alert note
    if (data.installType === "in-ground") {
      html += '<div class="summary-note">Dig Alert (811) notification required at least 2 working days before excavation. All underground utilities must be marked.</div>';
    }

    el.innerHTML = html;
  }
};
