// ============================================================
// SALES ESTIMATOR — Fence Purchase tab
// ============================================================

var SalesEstimator = {
  init: function () {
    this.renderProducts();
    this.bindEvents();
  },

  renderProducts: function () {
    var tbody = document.getElementById("sales-product-body");
    var html = "";
    CONFIG.salesProducts.forEach(function (p) {
      html +=
        '<tr data-product="' + p.id + '">' +
        "<td>" + p.name + "</td>" +
        '<td class="col-price">' + Utils.formatCurrency(p.price) + "</td>" +
        '<td class="col-qty"><input type="number" min="0" step="1" value="0" inputmode="numeric" data-id="' + p.id + '" data-price="' + p.price + '"></td>' +
        '<td class="col-total">$0.00</td>' +
        "</tr>";
    });
    tbody.innerHTML = html;
  },

  bindEvents: function () {
    var self = this;
    var tbody = document.getElementById("sales-product-body");
    var zipInput = document.getElementById("sales-zip");

    tbody.addEventListener("input", function () {
      self.recalculate();
    });
    zipInput.addEventListener("input", function () {
      self.recalculate();
    });
  },

  recalculate: function () {
    var rows = document.querySelectorAll("#sales-product-body tr");
    var subtotal = 0;

    // Calculate line totals
    rows.forEach(function (row) {
      var input = row.querySelector("input");
      var qty = parseInt(input.value) || 0;
      var price = parseFloat(input.getAttribute("data-price"));
      var lineTotal = qty * price;
      row.querySelector(".col-total").textContent = Utils.formatCurrency(lineTotal);
      subtotal += lineTotal;
    });

    // Volume discount
    var discount = 0;
    var discountPercent = 0;
    for (var i = 0; i < CONFIG.salesVolumeDiscounts.length; i++) {
      if (subtotal >= CONFIG.salesVolumeDiscounts[i].threshold) {
        discountPercent = CONFIG.salesVolumeDiscounts[i].discount;
        discount = subtotal * discountPercent;
        break;
      }
    }

    var discountedSubtotal = subtotal - discount;
    var tax = discountedSubtotal * CONFIG.salesTaxRate;
    var afterTax = discountedSubtotal + tax;

    // Delivery
    var zipInput = document.getElementById("sales-zip");
    var zip = zipInput.value.trim();
    var delivery = { miles: null, cost: 0, free: false, error: false };
    var deliveryInfo = document.getElementById("sales-delivery-info");

    if (zip.length === 5) {
      delivery = Distance.salesDeliveryCost(zip, discountedSubtotal);
      if (delivery.error) {
        deliveryInfo.textContent = "Zip code not in our delivery area — please call for a quote.";
        deliveryInfo.style.color = "var(--error)";
      } else if (delivery.free) {
        deliveryInfo.textContent = delivery.miles + " miles — Free delivery (order over $5,000 within 60 mi)";
        deliveryInfo.style.color = "var(--accent)";
      } else {
        deliveryInfo.textContent = delivery.miles + " miles × $" + CONFIG.salesDelivery.perMileRate + "/mi = " + Utils.formatCurrency(delivery.cost);
        deliveryInfo.style.color = "var(--text-muted)";
      }
    } else {
      deliveryInfo.textContent = "";
    }

    var grandTotal = afterTax + delivery.cost;

    // Render summary
    this.renderSummary(subtotal, discountPercent, discount, discountedSubtotal, tax, delivery, grandTotal);
  },

  renderSummary: function (subtotal, discountPercent, discount, discountedSubtotal, tax, delivery, grandTotal) {
    var el = document.getElementById("sales-summary-content");

    if (subtotal === 0) {
      el.innerHTML = '<p class="empty-state">Add quantities above to see your estimate.</p>';
      return;
    }

    var html = "";

    // Subtotal
    html += '<div class="summary-section">';
    html += '<div class="summary-line"><span class="label">Subtotal</span><span class="value">' + Utils.formatCurrency(subtotal) + "</span></div>";

    if (discount > 0) {
      html += '<div class="summary-line"><span class="label">Volume Discount (' + (discountPercent * 100) + '%)<span class="summary-badge badge-discount">Savings</span></span><span class="value" style="color:var(--accent)">−' + Utils.formatCurrency(discount) + "</span></div>";
      html += '<div class="summary-line"><span class="label">After Discount</span><span class="value">' + Utils.formatCurrency(discountedSubtotal) + "</span></div>";
    }

    html += '<div class="summary-line"><span class="label">Sales Tax (9.5%)</span><span class="value">' + Utils.formatCurrency(tax) + "</span></div>";
    html += "</div>";

    // Delivery
    if (delivery.miles !== null && !delivery.error) {
      html += '<hr class="summary-divider">';
      html += '<div class="summary-section">';
      if (delivery.free) {
        html += '<div class="summary-line"><span class="label">Delivery (' + delivery.miles + ' mi)<span class="summary-badge badge-free">Free</span></span><span class="value">$0.00</span></div>';
      } else {
        html += '<div class="summary-line"><span class="label">Delivery (' + delivery.miles + " mi × $" + CONFIG.salesDelivery.perMileRate + '/mi)</span><span class="value">' + Utils.formatCurrency(delivery.cost) + "</span></div>";
      }
      html += "</div>";
    }

    // Grand total
    html += '<hr class="summary-divider">';
    html += '<div class="summary-total"><span>Estimated Total</span><span>' + Utils.formatCurrency(grandTotal) + "</span></div>";

    // Discount threshold hints
    if (subtotal > 0 && subtotal < 3000) {
      var gap = 3000 - subtotal;
      html += '<div class="summary-note info">Add ' + Utils.formatCurrency(gap) + " more for 10% volume discount.</div>";
    }

    el.innerHTML = html;
  }
};
