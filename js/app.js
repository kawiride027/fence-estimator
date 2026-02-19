// ============================================================
// APP — Tab switching, initialization, and PDF export
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

  // PDF export buttons
  document.getElementById("rental-save-pdf").addEventListener("click", function () {
    PdfExport.exportEstimate("fence-rental", "Fence Rental Estimate");
  });
  document.getElementById("sales-save-pdf").addEventListener("click", function () {
    PdfExport.exportEstimate("fence-purchase", "Fence Purchase Estimate");
  });
  document.getElementById("barricade-save-pdf").addEventListener("click", function () {
    PdfExport.exportEstimate("barricade-rental", "Barricade Rental Estimate");
  });
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

// ============================================================
// PDF Export — opens a print-friendly window
// ============================================================

var PdfExport = {
  exportEstimate: function (tabId, title) {
    // Gather customer info from the active tab
    var prefix = "";
    if (tabId === "fence-rental") prefix = "rental";
    else if (tabId === "fence-purchase") prefix = "sales";
    else if (tabId === "barricade-rental") prefix = "barricade";

    var custName = document.getElementById(prefix + "-cust-name").value.trim();
    var custPhone = document.getElementById(prefix + "-cust-phone").value.trim();
    var custEmail = document.getElementById(prefix + "-cust-email").value.trim();
    var custAddress = document.getElementById(prefix + "-cust-address").value.trim();

    // Get summary HTML
    var summaryContentId = "";
    if (tabId === "fence-rental") summaryContentId = "rental-summary-content";
    else if (tabId === "fence-purchase") summaryContentId = "sales-summary-content";
    else if (tabId === "barricade-rental") summaryContentId = "barricade-summary-content";

    var summaryHtml = document.getElementById(summaryContentId).innerHTML;

    // Build the customer info section
    var customerHtml = "";
    if (custName || custPhone || custEmail || custAddress) {
      customerHtml += '<div class="pdf-customer">';
      customerHtml += '<h3>Customer Information</h3>';
      if (custName) customerHtml += '<p><strong>Name:</strong> ' + custName + '</p>';
      if (custPhone) customerHtml += '<p><strong>Phone:</strong> ' + custPhone + '</p>';
      if (custEmail) customerHtml += '<p><strong>Email:</strong> ' + custEmail + '</p>';
      if (custAddress) customerHtml += '<p><strong>Job Site:</strong> ' + custAddress + '</p>';
      customerHtml += '</div>';
    }

    // Build date string
    var now = new Date();
    var dateStr = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();

    // Build print window
    var printWindow = window.open("", "_blank");
    printWindow.document.write('<!DOCTYPE html><html><head><title>' + title + '</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(this.getPrintStyles());
    printWindow.document.write('</style></head><body>');

    // Header with logo
    printWindow.document.write('<div class="pdf-header">');
    printWindow.document.write('<img src="img/logo.png" alt="Logo" class="pdf-logo" onerror="this.style.display=\'none\'">');
    printWindow.document.write('<div class="pdf-company">');
    printWindow.document.write('<h1>' + CONFIG.companyName + '</h1>');
    printWindow.document.write('<p>Sylmar, CA 91342</p>');
    printWindow.document.write('</div>');
    printWindow.document.write('</div>');

    // Title and date
    printWindow.document.write('<div class="pdf-title">');
    printWindow.document.write('<h2>' + title + '</h2>');
    printWindow.document.write('<p class="pdf-date">Date: ' + dateStr + '</p>');
    printWindow.document.write('</div>');

    // Customer info
    printWindow.document.write(customerHtml);

    // Estimate summary
    printWindow.document.write('<div class="pdf-summary">');
    printWindow.document.write(summaryHtml);
    printWindow.document.write('</div>');

    // Footer
    printWindow.document.write('<div class="pdf-footer">');
    printWindow.document.write('<p>Prices subject to change. Estimates are not final quotes.</p>');
    printWindow.document.write('</div>');

    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = function () {
      printWindow.print();
    };
  },

  getPrintStyles: function () {
    return [
      '* { margin: 0; padding: 0; box-sizing: border-box; }',
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px 40px; font-size: 14px; }',
      '.pdf-header { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 3px solid #41a329; margin-bottom: 20px; }',
      '.pdf-logo { max-height: 60px; max-width: 180px; }',
      '.pdf-company h1 { font-size: 22px; color: #41a329; margin: 0; }',
      '.pdf-company p { color: #64748b; font-size: 13px; }',
      '.pdf-title { margin-bottom: 20px; }',
      '.pdf-title h2 { font-size: 18px; color: #1e293b; }',
      '.pdf-date { color: #64748b; font-size: 13px; margin-top: 2px; }',
      '.pdf-customer { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }',
      '.pdf-customer h3 { font-size: 14px; color: #41a329; margin-bottom: 8px; }',
      '.pdf-customer p { font-size: 13px; margin-bottom: 4px; }',
      '.pdf-summary { margin-bottom: 30px; }',
      '.summary-section { margin-bottom: 10px; }',
      '.summary-section-title { font-weight: 600; font-size: 13px; color: #41a329; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }',
      '.summary-line { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }',
      '.summary-line .label { flex: 1; }',
      '.summary-line .label small { color: #64748b; margin-left: 4px; }',
      '.summary-line .value { font-weight: 500; text-align: right; min-width: 100px; }',
      '.summary-divider { border: none; border-top: 1px solid #e2e8f0; margin: 8px 0; }',
      '.summary-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; padding: 10px 0; color: #1e293b; }',
      '.summary-badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle; }',
      '.badge-free { background: #ecfdf5; color: #059669; }',
      '.badge-min { background: #fef3c7; color: #d97706; }',
      '.badge-discount { background: #ecfdf5; color: #059669; }',
      '.summary-note { font-size: 12px; color: #64748b; padding: 8px; background: #f8fafc; border-radius: 6px; margin-top: 8px; }',
      '.summary-note.info { background: #ecf5ea; color: #2d7a1a; }',
      '.pdf-footer { border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 11px; }',
      '.empty-state { display: none; }',
      '@media print { body { padding: 20px; } }'
    ].join('\n');
  }
};
