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

    // Step 1: Coverage (just linear feet — site type removed)
    document.getElementById("rental-linear-feet").addEventListener("input", function () {
      self.checkStep1();
      self.recalculate();
    });

    // Step 2: Height
    document.querySelectorAll('input[name="rental-height"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.unlockStep(3);
        self.updateGateLabels();
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
        // Reset steps from 6 onward because sandbag step visibility depends on install type
        self.resetStepsFrom(6);
        // Re-evaluate gate completion to trigger correct post-gate flow
        self.checkStep5();
        self.recalculate();
      });
    });

    // Step 4: Privacy (no color sub-option anymore)
    document.querySelectorAll('input[name="rental-privacy"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.unlockStep(5);
        self.recalculate();
      });
    });

    // Step 5: Gates — vehicle gate yes/no
    document.querySelectorAll('input[name="rental-vehicle-gate"]').forEach(function (r) {
      r.addEventListener("change", function () {
        var show = r.value === "yes" && r.checked;
        document.getElementById("rental-vehicle-gate-type-group").classList.toggle("hidden", !show);
        if (!show) {
          document.querySelectorAll('input[name="rental-vehicle-gate-type"]').forEach(function (rt) { rt.checked = false; });
        }
        self.checkStep5();
        self.recalculate();
      });
    });
    // Vehicle gate type sub-option
    document.querySelectorAll('input[name="rental-vehicle-gate-type"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.checkStep5();
        self.recalculate();
      });
    });
    // Pedestrian gate yes/no
    document.querySelectorAll('input[name="rental-ped-gate"]').forEach(function (r) {
      r.addEventListener("change", function () {
        self.checkStep5();
        self.recalculate();
      });
    });

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
    if (feet > 0) {
      this.unlockStep(2);
    }
  },

  handleSurfaceChange: function () {
    var surface = Utils.getRadioValue("rental-surface");
    var installGroup = document.getElementById("rental-install-type-group");

    // Show install type options for BOTH dirt and concrete
    installGroup.classList.remove("hidden");
    // Clear previous install type selection
    document.querySelectorAll('input[name="rental-install-type"]').forEach(function (r) {
      r.checked = false;
    });
  },

  updateGateLabels: function () {
    var height = Utils.getRadioValue("rental-height");
    var h = height === "8ft" ? "8" : "6";
    var stdLabel = document.getElementById("rental-vgate-standard-label");
    var dwLabel = document.getElementById("rental-vgate-doublewide-label");
    if (stdLabel) stdLabel.textContent = h + "×10 / " + h + "×12 Standard — $" + CONFIG.rental.gates.vehicleStandard;
    if (dwLabel) dwLabel.textContent = h + "×20 Double-Wide — $" + CONFIG.rental.gates.vehicleDoubleWide;
  },

  handlePrivacyChange: function () {
    // No longer needed — privacy is just yes/no, immediately unlocks step 5
  },

  checkStep5: function () {
    var vehicleGate = Utils.getRadioValue("rental-vehicle-gate");
    var pedGate = Utils.getRadioValue("rental-ped-gate");

    // Both must be answered
    if (!vehicleGate || !pedGate) return;

    // If vehicle gate is "yes", must also pick a type
    if (vehicleGate === "yes") {
      var gateType = Utils.getRadioValue("rental-vehicle-gate-type");
      if (!gateType) return;
    }

    var installType = Utils.getRadioValue("rental-install-type");

    if (installType === "in-ground") {
      // In-ground installs use posts, NOT sandbags — skip Step 6 entirely
      document.getElementById("rental-sandbag-qty").value = 0;
      document.getElementById("rental-sandbag-qty").setAttribute("data-auto-filled", "false");
      // Lock Step 6 if it was previously unlocked (e.g. user switched from above-ground)
      var step6 = document.getElementById("rental-step-6");
      if (step6 && !step6.classList.contains("locked")) {
        step6.classList.add("locked");
        step6.classList.remove("active", "completed");
      }
      // Skip straight to Step 7 (Duration) and Step 8 (Delivery)
      this.unlockStep(7);
      this.unlockStep(8);
    } else {
      // Above-ground installs use sandbags — show Step 6 normally
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
    var vehicleGateType = Utils.getRadioValue("rental-vehicle-gate-type");
    var pedGate = Utils.getRadioValue("rental-ped-gate");
    var sandbagQty = parseInt(document.getElementById("rental-sandbag-qty").value) || 0;
    var duration = parseInt(document.getElementById("rental-duration").value) || 6;
    var zip = document.getElementById("rental-zip").value.trim();

    if (linearFeet <= 0 || !height) {
      this.renderSummary(null);
      return;
    }

    var roundedFeet = Utils.roundUpToPanel(linearFeet);
    var panels = Utils.panelCount(linearFeet);
    var rates = CONFIG.rental.rates[height];

    // Fence cost (rounded footage)
    var fenceCost = roundedFeet * rates.fence;

    // In-ground vs above-ground logic:
    // - In-ground: uses posts ($20/post), NO sandbags. Drilling surcharge only on concrete.
    // - Above-ground: uses sandbags, NO posts, NO drilling surcharge.
    var concreteSurcharge = 0;
    var postCount = 0;
    var postCost = 0;
    if (installType === "in-ground") {
      postCount = panels * CONFIG.rental.postsPerPanel;
      postCost = postCount * CONFIG.rental.inGroundPostPrice;
      // Drilling surcharge only for in-ground on concrete
      if (surface === "concrete") {
        concreteSurcharge = roundedFeet * CONFIG.rental.concreteSurcharge;
      }
      // In-ground installs do NOT use sandbags — force qty to 0
      sandbagQty = 0;
    }

    // Gate charges
    var vehicleGateCost = 0;
    var vehicleGateLabel = "";
    if (vehicleGate === "yes" && vehicleGateType) {
      if (vehicleGateType === "standard") {
        vehicleGateCost = CONFIG.rental.gates.vehicleStandard;
        vehicleGateLabel = "Vehicle Gate (Standard)";
      } else if (vehicleGateType === "double-wide") {
        vehicleGateCost = CONFIG.rental.gates.vehicleDoubleWide;
        vehicleGateLabel = "Vehicle Gate (Double-Wide)";
      }
    }
    var pedGateCost = 0;
    if (pedGate === "yes") {
      pedGateCost = CONFIG.rental.gates.pedestrian;
    }
    var totalGateCost = vehicleGateCost + pedGateCost;

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

    // Purchase charges (privacy screen + sandbags — taxable)
    var privacyScreenCost = 0;
    if (privacy === "yes") {
      privacyScreenCost = linearFeet * rates.privacyScreen; // actual feet, no rounding
    }
    var sandbagCost = sandbagQty * CONFIG.rental.sandbagPrice;
    var purchaseSubtotal = privacyScreenCost + sandbagCost;
    var purchaseTax = purchaseSubtotal * CONFIG.salesTaxRate;

    // $950 minimum — applied to ENTIRE pre-tax invoice (rental + purchase + delivery)
    var rentalCharges = fenceCost + concreteSurcharge + postCost + totalGateCost + delivery.cost;
    var invoicePreTax = rentalCharges + purchaseSubtotal;
    var minimumApplied = false;
    if (invoicePreTax < CONFIG.rental.minimumRentalPrice) {
      minimumApplied = true;
      // Bump the rental portion to make up the difference
      var deficit = CONFIG.rental.minimumRentalPrice - invoicePreTax;
      rentalCharges += deficit;
      invoicePreTax = CONFIG.rental.minimumRentalPrice;
    }

    // Extension charges — calculated on rental charges only (fence + surcharges + gates + delivery)
    var ext = Utils.calculateExtensionCharges(rentalCharges, duration);

    // Purchase total (with tax)
    var purchaseTotal = purchaseSubtotal + purchaseTax;

    // Grand total
    var grandTotal = rentalCharges + ext.extensionTotal + purchaseTotal;

    // Show/hide PDF button
    document.getElementById("rental-save-pdf").style.display = "inline-block";

    this.renderSummary({
      linearFeet: linearFeet,
      roundedFeet: roundedFeet,
      panels: panels,
      height: height,
      surface: surface,
      installType: installType,
      rates: rates,
      fenceCost: fenceCost,
      concreteSurcharge: concreteSurcharge,
      postCount: postCount,
      postCost: postCost,
      vehicleGate: vehicleGate,
      vehicleGateType: vehicleGateType,
      vehicleGateCost: vehicleGateCost,
      vehicleGateLabel: vehicleGateLabel,
      pedGate: pedGate,
      pedGateCost: pedGateCost,
      totalGateCost: totalGateCost,
      delivery: delivery,
      rentalCharges: rentalCharges,
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
      document.getElementById("rental-save-pdf").style.display = "none";
      return;
    }

    var html = "";

    // Rental charges
    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Rental Charges (6-month base)</div>';
    html += '<div class="summary-line"><span class="label">Fence <small>' + data.roundedFeet + " LF of " + data.height + " @ " + Utils.formatCurrency(data.rates.fence) + '/LF</small></span><span class="value">' + Utils.formatCurrency(data.fenceCost) + "</span></div>";

    if (data.concreteSurcharge > 0) {
      html += '<div class="summary-line"><span class="label">Concrete drilling surcharge <small>' + data.roundedFeet + " LF @ $1.50/LF</small></span><span class=\"value\">" + Utils.formatCurrency(data.concreteSurcharge) + "</span></div>";
    }

    if (data.postCost > 0) {
      html += '<div class="summary-line"><span class="label">In-ground posts <small>' + data.postCount + " posts × $" + CONFIG.rental.inGroundPostPrice + '</small></span><span class="value">' + Utils.formatCurrency(data.postCost) + "</span></div>";
    }

    if (data.vehicleGateCost > 0) {
      html += '<div class="summary-line"><span class="label">' + data.vehicleGateLabel + ' <small>wheel included</small></span><span class="value">' + Utils.formatCurrency(data.vehicleGateCost) + "</span></div>";
    }

    if (data.pedGateCost > 0) {
      html += '<div class="summary-line"><span class="label">Pedestrian Gate</span><span class="value">' + Utils.formatCurrency(data.pedGateCost) + "</span></div>";
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
    html += '</span><span class="value"><strong>' + Utils.formatCurrency(data.rentalCharges) + "</strong></span></div>";
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
        html += '<div class="summary-line"><span class="label">Sandbags <small>' + data.sandbagQty + " × $" + CONFIG.rental.sandbagPrice.toFixed(2) + '</small></span><span class="value">' + Utils.formatCurrency(data.sandbagCost) + "</span></div>";
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
      html += '<div class="summary-note info">Monthly extension rate after 6 months: ' + Utils.formatCurrency(data.rentalCharges * CONFIG.rental.extensionRate) + "/mo (16% of rental)</div>";
    }

    // Dig Alert note
    if (data.installType === "in-ground") {
      html += '<div class="summary-note">Dig Alert (811) notification required at least 2 working days before excavation. All underground utilities must be marked.</div>';
    }

    el.innerHTML = html;
  }
};
