// utils.js

const Utils = (() => {

    function formatNumber(num, options = {}) {
        // Example: format to currency or compact numbers
        const { style = 'decimal', currency = 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2, compact = false } = options;

        if (compact) {
            return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short',
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            }).format(num);
        } else if (style === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            }).format(num);
        } else {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: minimumFractionDigits,
                maximumFractionDigits: maximumFractionDigits
            }).format(num);
        }
    }

    function downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Add any other general utility functions here
    // e.g., debounce, throttle, date formatting, simple DOM manipulation helpers
    // function debounce(func, delay) { ... }
    // function throttle(func, delay) { ... }

    return {
        formatNumber: formatNumber,
        downloadFile: downloadFile,
        // Add other utility functions here
    };
})();
