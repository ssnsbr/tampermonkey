// utils.js
// General utility functions

console.log("[Utils] Initializing utils.js");

/**
 * Formats a number as a USD currency string.
 * @param {number} amount The number to format.
 * @param {number} [decimalPlaces=2] The number of decimal places to include.
 * @returns {string} The formatted USD string.
 */
function formatUSD(amount, decimalPlaces = 2) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    }).format(amount);
}

/**
 * Downloads data as a file.
 * @param {string} content The content of the file.
 * @param {string} filename The name of the file.
 * @param {string} mimeType The MIME type of the file (e.g., 'application/json', 'text/csv').
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`[Utils] Downloaded file: ${filename}`);
}

/**
 * Converts an array of objects to a CSV string.
 * Assumes all objects have the same keys.
 * @param {Array<object>} data The array of objects to convert.
 * @returns {string} The CSV string.
 */
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Handle null/undefined, and wrap strings with commas in quotes
            const formattedValue = (value === null || value === undefined) ? '' : String(value);
            return formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')
                   ? `"${formattedValue.replace(/"/g, '""')}"`
                   : formattedValue;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}
