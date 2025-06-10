// data_processor.js
// This file is loaded via @require in main.js
// It exports an object 'DataProcessor' to the global scope.

(function() {
    'use strict';

    let collectedChartData = []; // To store historical chart data for download

    const DataProcessor = {
        processMarketData: function(rawData) {
            // This is a crucial function. You need to parse the raw WebSocket
            // message according to Axiom's actual WebSocket data format.
            console.log("DataProcessor: Processing raw market data...", rawData);
            try {
                const data = JSON.parse(rawData); // Assuming rawData is a JSON string

                // Example: Extracting relevant fields. Adjust these based on actual data.
                const marketCap = data.marketCap || 0;
                const volume = data.volume24h || 0;
                const ath = data.allTimeHigh || 0;
                const price = data.price || 0;

                return {
                    marketCap: marketCap,
                    volume: volume,
                    ath: ath,
                    price: price,
                    // Add other relevant fields here
                };
            } catch (e) {
                console.error("DataProcessor: Error parsing market data:", e, rawData);
                return null;
            }
        },

        processChartData: function(rawData) {
            // Process historical data received from the API request
            console.log("DataProcessor: Processing raw chart data...", rawData);
            try {
                const data = JSON.parse(rawData); // Assuming rawData is a JSON string

                // Example: Assuming data is an array of objects like [{timestamp, price, volume}, ...]
                // You'll need to adapt this to the actual structure of the historical data API.
                if (Array.isArray(data)) {
                    collectedChartData = data.map(item => ({
                        time: item.timestamp, // or item.t
                        open: item.open,     // or item.o
                        high: item.high,     // or item.h
                        low: item.low,       // or item.l
                        close: item.close,   // or item.c
                        volume: item.volume  // or item.v
                    }));
                    return collectedChartData;
                } else {
                    console.warn("DataProcessor: Raw chart data is not an array.", rawData);
                    return [];
                }
            } catch (e) {
                console.error("DataProcessor: Error parsing chart data:", e, rawData);
                return [];
            }
        },

        getCollectedChartData: function() {
            return collectedChartData;
        }

        // Add other data processing functions here (e.g., for different data types)
    };

    // Expose DataProcessor to the global scope
    window.DataProcessor = DataProcessor;

})();
