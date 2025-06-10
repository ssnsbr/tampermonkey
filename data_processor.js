// data_processor.js

const DataProcessor = (() => {
    let historicalChartData = []; // To store captured chart data

    // Processes raw WebSocket data
    function processWebSocketData(rawData) {
        // Only log when parsing, not for every received raw message, as it's now filtered upstream.
        // console.log('DataProcessor: Received raw WebSocket data:', rawData); // <--- REMOVED THIS LINE

        try {
            const data = JSON.parse(rawData);
            // console.log('DataProcessor: Parsed WebSocket data:', data); // <--- Optionally remove/comment this too if you only want to see the final extracted values

            // Assuming the structure for these keys. ADJUST THESE PATHS based on your actual data!
            const marketCap = data.marketCap || data.mc || data.market_cap;
            const volume = data.volume24h || data.vol || data.volume_24h;
            const ath = data.allTimeHigh || data.ath || data.all_time_high;

            // console.log('DataProcessor: Extracted values - MarketCap:', marketCap, 'Volume:', volume, 'ATH:', ath); // <--- Optionally keep this for key info

            return {
                marketCap: Utils.formatNumber(marketCap, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                volume: Utils.formatNumber(volume, { style: 'currency', currency: 'USD', compact: true, minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                ath: Utils.formatNumber(ath, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };
        } catch (e) {
            console.error('DataProcessor: Error parsing or processing WebSocket data:', e, 'Raw Data:', rawData);
            return {
                marketCap: '---',
                volume: '---',
                ath: '---',
            };
        }
    }

    // Processes raw data from HTTP requests (e.g., historical chart data)
    function processRequestData(rawData, requestUrl) { // Added requestUrl for context
        // We will remove the general raw data logging from here too.
        // If you only want to log *specific* request data, you'll need filtering logic here.
        // console.log('DataProcessor: Received raw Request data:', rawData); // <--- REMOVED THIS LINE

        try {
            const data = JSON.parse(rawData);
            // console.log('DataProcessor: Parsed Request data for URL:', requestUrl, data); // <--- Keep this if you want to see parsed data from specific requests

            // Example: Only process/log data from specific URLs for historical data
            if (requestUrl && requestUrl.includes('/some/chart/history/endpoint')) {
                if (Array.isArray(data)) {
                    historicalChartData = [...new Set([...historicalChartData, ...data])];
                    console.log('DataProcessor: Updated historical chart data. Total points:', historicalChartData.length);
                }
            }
            // Otherwise, don't log or store data you don't care about

            return data; // Return the raw processed data for further use if needed, but not all of it will be stored/logged
        } catch (e) {
            console.error('DataProcessor: Error parsing request data for URL:', requestUrl, e, 'Raw Data:', rawData);
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
