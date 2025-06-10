// data_processor.js

const DataProcessor = (() => {
    let historicalChartData = []; // To store captured chart data

    // Processes raw WebSocket data
    function processWebSocketData(rawData) {
        // IMPORTANT: Log the raw data first to understand its structure
        console.log('DataProcessor: Received raw WebSocket data:', rawData);

        try {
            const data = JSON.parse(rawData);
            console.log('DataProcessor: Parsed WebSocket data:', data);

            // Assuming the structure for these keys. ADJUST THESE PATHS based on your actual data!
            // If data.marketCap is nested, e.g., data.metrics.marketCap, you MUST change this.
            const marketCap = data.marketCap || data.mc || data.market_cap; // Example: Try common key names
            const volume = data.volume24h || data.vol || data.volume_24h;
            const ath = data.allTimeHigh || data.ath || data.all_time_high;

            console.log('DataProcessor: Extracted values - MarketCap:', marketCap, 'Volume:', volume, 'ATH:', ath);

            // Use Utils to format numbers. Utils.formatNumber will now handle NaN gracefully.
            return {
                marketCap: Utils.formatNumber(marketCap, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                volume: Utils.formatNumber(volume, { style: 'currency', currency: 'USD', compact: true, minimumFractionDigits: 0, maximumFractionDigits: 2 }), // Adjusted compact options
                ath: Utils.formatNumber(ath, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };
        } catch (e) {
            console.error('DataProcessor: Error parsing or processing WebSocket data:', e, 'Raw Data:', rawData);
            // Return default/fallback data if parsing fails
            return {
                marketCap: '---',
                volume: '---',
                ath: '---',
            };
        }
    }

    // Processes raw data from HTTP requests (e.g., historical chart data)
    function processRequestData(rawData) {
        console.log('DataProcessor: Received raw Request data:', rawData);
        try {
            const data = JSON.parse(rawData);
            console.log('DataProcessor: Parsed Request data:', data);

            // Example: Assuming data is an array of chart points { timestamp, price }
            if (Array.isArray(data)) {
                // Deduplicate or sort if necessary if new data overlaps with existing
                historicalChartData = [...new Set([...historicalChartData, ...data])]; // Simple deduplication
                console.log('DataProcessor: Updated historical chart data. Total points:', historicalChartData.length);
            }
            return data; // Return the raw processed data for further use if needed
        } catch (e) {
            console.error('DataProcessor: Error parsing request data:', e, 'Raw Data:', rawData);
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
