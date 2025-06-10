// data_processor.js

const DataProcessor = (() => {
    let historicalChartData = []; // To store captured chart data

    // Processes raw WebSocket data
    function processWebSocketData(rawData) {
        // IMPORTANT: Your existing logic to parse and extract marketCap, volume, ATH from raw WebSocket data goes here.
        // This is where you would put your JSON parsing and property extraction.
        try {
            const data = JSON.parse(rawData);
            // Example structure, adjust based on your actual data:
            const marketCap = data.marketCap || 'N/A';
            const volume = data.volume24h || 'N/A';
            const ath = data.allTimeHigh || 'N/A';

            // Use Utils to format numbers if needed
            return {
                marketCap: Utils.formatNumber(parseFloat(marketCap), { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                volume: Utils.formatNumber(parseFloat(volume), { style: 'currency', currency: 'USD', compact: true }),
                ath: Utils.formatNumber(parseFloat(ath), { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };
        } catch (e) {
            console.error('DataProcessor: Error parsing WebSocket data:', e);
            return null;
        }
    }

    // Processes raw data from HTTP requests (e.g., historical chart data)
    function processRequestData(rawData) {
        // IMPORTANT: Your existing logic to parse and extract historical chart data from raw request data goes here.
        // This is where you might store historical points if your existing code captures it.
        try {
            const data = JSON.parse(rawData);
            // Example: Assuming data is an array of chart points { timestamp, price }
            if (Array.isArray(data)) {
                historicalChartData = historicalChartData.concat(data); // Append new data
                // Deduplicate or sort if necessary
            }
            return data; // Return the raw processed data for further use if needed
        } catch (e) {
            console.error('DataProcessor: Error parsing request data:', e);
            return null;
        }
    }

    // Provides the collected chart data for download
    function getChartDataForDownload() {
        return JSON.stringify(historicalChartData, null, 2);
    }

    return {
        processWebSocketData: processWebSocketData,
        processRequestData: processRequestData,
        getChartDataForDownload: getChartDataForDownload,
    };
})();
