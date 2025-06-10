// utils.js

const Utils = (() => {
    /**
     * Formats a number using Intl.NumberFormat.
     * @param {number} num The number to format.
     * @param {object} options Formatting options.
     * @returns {string} The formatted number string.
     */
    function formatNumber(num, options = {}) {
        if (typeof num !== 'number' || isNaN(num)) {
            return options.defaultValue || 'N/A';
        }

        const defaultOptions = {
            style: 'decimal',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            compact: false,
            notation: 'standard'
        };

        const mergedOptions = { ...defaultOptions, ...options };

        if (mergedOptions.compact) {
            mergedOptions.notation = 'compact';
        }

        try {
            return new Intl.NumberFormat('en-US', mergedOptions).format(num);
        } catch (e) {
            console.error("Error formatting number:", num, e);
            return num.toFixed(mergedOptions.minimumFractionDigits); // Fallback
        }
    }

    /**
     * Formats an amount as USD currency.
     * @param {number} amount The amount to format.
     * @param {number} fractionDigits Number of decimal places.
     * @returns {string} The formatted USD string.
     */
    function formatUSD(amount, fractionDigits = 0) {
        return formatNumber(amount, { style: 'currency', currency: 'USD', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    }

    /**
     * Downloads data as a file.
     * @param {string} data The data to download.
     * @param {string} filename The name of the file.
     * @param {string} type The MIME type of the file.
     */
    function downloadFile(data, filename, type) {
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

    /**
 * Converts an array of objects to a CSV string.
 * @param {Array<object>} objArray The array of objects.
 * @returns {string} The CSV string.
 */
function convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = '';

    if (array.length === 0) return '';

    // Header row
    for (let index in array[0]) {
        row += index + ',';
    }
    row = row.slice(0, -1); // Remove trailing comma
    str += row + '\r\n';

    // Data rows
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line != '') line += ',';

            let value = array[i][index];

            // Handle null and undefined values
            if (value === null || typeof value === 'undefined') {
                value = ''; // Treat null/undefined as empty string in CSV
            } else if (typeof value === 'object') {
                // For objects, stringify and then handle like a string
                value = JSON.stringify(value);
            } else {
                // Convert all other types (numbers, booleans, etc.) to string
                value = String(value);
            }

            // Escape quotes for CSV
            value = value.replace(/"/g, '""');

            // Enclose in quotes if it contains commas, newlines, or quotes
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            line += value;
        }
        str += line + '\r\n';
    }
    return str;
}

    return {
        formatNumber,
        formatUSD,
        downloadFile,
        convertToCSV
    };
})();
