// ============================================================
// BARRICADE ESTIMATOR — Barricade Rental tab
// ============================================================

var BarricadeEstimator = {
  init: function () {
    this.bindEvents();
  },

  bindEvents: function () {
    var self = this;
    document.getElementById("barricade-linear-feet").addEventListener("input", function () { self.recalculate(); });
    document.getElementById("barricade-duration").addEventListener("change", function () { self.recalculate(); });
    document.getElementById("barricade-zip").addEventListener("input", function () { self.recalculate(); });
  },

  recalculate: function () {
    var linearFeet = parseInt(document.getElementById("barricade-linear-feet").value) || 0;
    var duration = parseInt(document.getElementById("barricade-duration").value) || 6;
    var zip = document.getElementById("barricade-zip").value.trim();

    if (linearFeet <= 0) {
      this.renderSummary(null);
      return;
    }

    var roundedFeet = Utils.roundUpToPanel(linearFeet);
    var rate = CONFIG.rental.barricadeRate;
    var barricadeCost = roundedFeet * rate;

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

    // Rental subtotal
    var rentalSubtotal = barricadeCost + delivery.cost;
    var minimumApplied = false;
    if (rentalSubtotal < CONFIG.rental.minimumRentalPrice) {
      minimumApplied = true;
      rentalSubtotal = CONFIG.rental.minimumRentalPrice;
    }

    // Extension charges
    var ext = Utils.calculateExtensionCharges(rentalSubtotal, duration);

    var grandTotal = rentalSubtotal + ext.extensionTotal;

    this.renderSummary({
      linearFeet: linearFeet,
      roundedFeet: roundedFeet,
      rate: rate,
      barricadeCost: barricadeCost,
      delivery: delivery,
      rentalSubtotal: rentalSubtotal,
      minimumApplied: minimumApplied,
      ext: ext,
      grandTotal: grandTotal,
      duration: duration
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
    html += '<div class="summary-section-title">Rental Charges (6-month base)</div>';
    html += '<div class="summary-line"><span class="label">Barricades <small>' + data.roundedFeet + " LF @ " + Utils.formatCurrency(data.rate) + '/LF</small></span><span class="value">' + Utils.formatCurrency(data.barricadeCost) + "</span></div>";

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

    // Grand total
    html += '<hr class="summary-divider">';
    html += '<div class="summary-total"><span>Estimated Total</span><span>' + Utils.formatCurrency(data.grandTotal) + "</span></div>";

    // Extension rate note
    if (data.duration <= 6) {
      html += '<div class="summary-note info">Monthly extension rate after 6 months: ' + Utils.formatCurrency(data.rentalSubtotal * CONFIG.rental.extensionRate) + "/mo (16% of rental)</div>";
    }

    el.innerHTML = html;
  }
};
