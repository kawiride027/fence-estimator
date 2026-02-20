// ============================================================
// BARRICADE ESTIMATOR — Barricade Rental tab (monthly pricing)
// ============================================================

var BarricadeEstimator = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    var self = this;
    document.getElementById("barricade-linear-feet").addEventListener("input", function () { self.recalculate(); });
    document.querySelectorAll('input[name="barricade-duration"]').forEach(function (r) {
      r.addEventListener("change", function () { self.recalculate(); });
    });
    document.getElementById("barricade-zip").addEventListener("input", function () { self.recalculate(); });
  },

  recalculate: function () {
    var linearFeet = parseInt(document.getElementById("barricade-linear-feet").value) || 0;
    var durationEl = document.querySelector('input[name="barricade-duration"]:checked');
    var months = durationEl ? parseInt(durationEl.value) : 0;
    var zip = document.getElementById("barricade-zip").value.trim();

    if (linearFeet <= 0 || months <= 0) {
      this.renderSummary(null);
      document.getElementById("barricade-save-pdf").style.display = "none";
      return;
    }

    // Calculate barricade count (round up)
    var barricadeCount = Math.ceil(linearFeet / CONFIG.rental.barricadeLengthFt);
    var monthlyCost = barricadeCount * CONFIG.rental.barricadePrice;
    var durationCost = monthlyCost * months;

    // Delivery
    var delivery = { miles: null, cost: 0, free: false, error: false };
    var deliveryInfo = document.getElementById("barricade-delivery-info");
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

    // True total (before Install & Removal Fee)
    var trueTotal = durationCost + delivery.cost;

    // Install & Removal Fee — explicit line item to reach $950 minimum
    var installRemovalFee = 0;
    if (trueTotal < CONFIG.rental.minimumRentalPrice) {
      installRemovalFee = CONFIG.rental.minimumRentalPrice - trueTotal;
    }

    var grandTotal = trueTotal + installRemovalFee;

    // Show PDF button
    document.getElementById("barricade-save-pdf").style.display = "inline-block";

    this.renderSummary({
      linearFeet: linearFeet,
      barricadeCount: barricadeCount,
      monthlyCost: monthlyCost,
      months: months,
      durationCost: durationCost,
      delivery: delivery,
      trueTotal: trueTotal,
      installRemovalFee: installRemovalFee,
      grandTotal: grandTotal
    });
  },

  renderSummary: function (data) {
    var el = document.getElementById("barricade-summary-content");
    if (!data) {
      el.innerHTML = '<p class="empty-state">Fill in the fields above to see your estimate.</p>';
      return;
    }

    var html = "";

    // Rental charges
    html += '<div class="summary-section">';
    html += '<div class="summary-section-title">Barricade Rental</div>';
    html += '<div class="summary-line"><span class="label">Barricades <small>' + data.barricadeCount + " × " + Utils.formatCurrency(CONFIG.rental.barricadePrice) + ' each</small></span><span class="value">' + Utils.formatCurrency(data.monthlyCost) + "/mo</span></div>";

    if (data.months > 1) {
      html += '<div class="summary-line"><span class="label">Duration <small>' + data.months + " months × " + Utils.formatCurrency(data.monthlyCost) + '/mo</small></span><span class="value">' + Utils.formatCurrency(data.durationCost) + "</span></div>";
    }

    if (data.delivery.miles !== null && !data.delivery.error) {
      if (data.delivery.free) {
        html += '<div class="summary-line"><span class="label">Delivery <small>' + data.delivery.miles + ' mi</small><span class="summary-badge badge-free">Free</span></span><span class="value">$0.00</span></div>';
      } else {
        html += '<div class="summary-line"><span class="label">Delivery <small>' + data.delivery.billableMiles + " mi × $" + CONFIG.rental.delivery.perMileRate + '/mi</small></span><span class="value">' + Utils.formatCurrency(data.delivery.cost) + "</span></div>";
      }
    }

    if (data.installRemovalFee > 0) {
      html += '<div class="summary-line"><span class="label">Install & Removal Fee <span class="summary-badge badge-min">Min $950</span></span><span class="value">' + Utils.formatCurrency(data.installRemovalFee) + "</span></div>";
    }

    html += "</div>";

    // Grand total
    html += '<hr class="summary-divider">';
    html += '<div class="summary-total"><span>Estimated Total</span><span>' + Utils.formatCurrency(data.grandTotal) + "</span></div>";

    el.innerHTML = html;
  }
};
