// utils.js
// This file is loaded via @require in main.js
// It exports an object 'Utils' to the global scope.

(function() {
    'use strict';

    const Utils = {
        formatNumber: function(number, type = 'general') {
            if (typeof number !== 'number') return 'N/A';
            switch (type) {
                case 'currency':
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
                case 'compact_currency':
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' }).format(number);
                case 'percentage':
                    return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(number);
                case 'large_number':
                    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number);
                default:
                    return number.toLocaleString();
            }
        },

        // Helper to download data as a JSON file
        downloadDataAsJson: function(data, filename) {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        // You can add other utility functions here:
        // - Debounce/Throttle
        // - Cookie handling
        // - URL parameter parsing
        // - Date/time formatting specific to your needs
    };

    // Expose Utils to the global scope
    window.Utils = Utils;

})();
