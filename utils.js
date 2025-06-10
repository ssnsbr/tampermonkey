// utils.js

const Utils = (() => {

    function formatNumber(num, options = {}) {
        // Ensure num is a valid number, otherwise return a placeholder
        const parsedNum = parseFloat(num);
        if (Number.isNaN(parsedNum)) {
            return '---'; // Or 'N/A', or 'Invalid Number'
        }

        const { style = 'decimal', currency = 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2, compact = false } = options;

        try {
            if (compact) {
                return new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    minimumFractionDigits: minimumFractionDigits,
                    maximumFractionDigits: maximumFractionDigits
                }).format(parsedNum);
            } else if (style === 'currency') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: minimumFractionDigits,
                    maximumFractionDigits: maximumFractionDigits
                }).format(parsedNum);
            } else {
                return new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: minimumFractionDigits,
                    maximumFractionDigits: maximumFractionDigits
                }).format(parsedNum);
            }
        } catch (e) {
            console.error("Utils.formatNumber: Error formatting number", num, e);
            return '---'; // Fallback in case of formatting error
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

    return {
        formatNumber: formatNumber,
        downloadFile: downloadFile,
    };
})();
