// utils.js
// General utility functions for downloading files and CSV conversion.

/**
 * Triggers a file download in the browser.
 * @param {string} content The content of the file.
 * @param {string} filename The name of the file to download.
 * @param {string} mimeType The MIME type of the file (e.g., 'application/json', 'text/csv').
 */
function downloadFile(content, filename, mimeType) {
    console.log(`[Utils] Attempting to download file: ${filename} (MIME: ${mimeType}, Size: ${content.length} chars)`);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Required for Firefox to click programmatically
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL object
    console.log(`[Utils] Download triggered for ${filename}`);
}

/**
 * Converts an array of JSON objects to a CSV string.
 * Assumes all objects in the array have consistent keys for headers.
 * Handles nested objects by stringifying them and escaping CSV special characters.
 * @param {Array<object>} data The array of objects to convert.
 * @returns {string} The CSV string.
 */
function convertToCSV(data) {
    if (!data || data.length === 0) {
        console.warn("[Utils] convertToCSV: No data provided, returning empty string.");
        return '';
    }

    console.log(`[Utils] convertToCSV: Converting ${data.length} objects to CSV.`);

    // Collect all unique headers from all objects to handle varying keys across objects
    const allKeys = new Set();
    data.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys); // Convert Set to Array for consistent order
    console.log("[Utils] CSV Headers detected:", headers);

    const csvRows = [];

    // Add headers row
    csvRows.push(headers.map(header => {
        // Escape header if it contains CSV special characters
        if (header.includes(',') || header.includes('"') || header.includes('\n')) {
            return `"${header.replace(/"/g, '""')}"`;
        }
        return header;
    }).join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) {
                val = '';
            } else if (typeof val === 'object') {
                // Convert objects/arrays to JSON string for CSV cell
                try {
                    val = JSON.stringify(val);
                } catch (e) {
                    console.error("[Utils] convertToCSV: Error stringifying nested object:", e);
                    val = String(val); // Fallback to string representation
                }
            } else {
                val = String(val); // Ensure it's a string
            }

            // Escape values containing commas, quotes, or newlines
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`; // Escape existing double quotes
            }
            return val;
        });
        csvRows.push(values.join(','));
    }

    console.log(`[Utils] convertToCSV: Generated ${csvRows.length} CSV rows.`);
    return csvRows.join('\n');
}

/**
 * Formats a number as USD with B/M/K suffixes or fixed decimals.
 * @param {number} num The number to format.
 * @param {number} [decimalPlaces=6] Optional: Number of decimal places for small numbers.
 * @returns {string} The formatted string.
 */
function formatUSD(num, decimalPlaces = 6) {
    if (typeof num !== 'number' || isNaN(num)) {
        return "N/A";
    }
    if (num >= 1000000000) { // Billions
        return "$" + (num / 1e9).toFixed(2) + "B";
    } else if (num >= 1000000) { // Millions
        return "$" + (num / 1e6).toFixed(2) + "M";
    } else if (num >= 1000) { // Thousands
        return "$" + (num / 1e3).toFixed(2) + "K";
    } else if (num >= 1) {
        return "$" + num.toFixed(2); // For values between $1 and $1000
    } else {
        return "$" + num.toFixed(decimalPlaces); // For small values
    }
}
