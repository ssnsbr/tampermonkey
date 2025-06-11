// data_processor.js
// Encapsulates logic for processing WebSocket data and maintaining state.

console.log("[DataProcessor] Initializing data_processor.js");

/* global Utils */ // Ensure Utils is accessible here

// --- Configuration ---
// IMPORTANT: This SOL_USD_PRICE is a placeholder. You might need to fetch this dynamically
// from another API (e.g., CoinGecko, CoinMarketCap) or find it on the Axiom page itself.
let SOL_USD_PRICE = 150; // Placeholder: Assume 1 SOL = $150 USD for now

// --- Data State ---
const dataState = {
    // General Token Info
    tokenSupply: 1_000_000_000, // Default fallback, will be updated by pulse message if available

    // Live Trade Data (from WebSocket 'trade' messages)
    lastPrice: 0,           // Last known price in USD from trade messages
    lastMarketCap: 0,       // Last calculated market cap in USD from trade messages (price * supply)
    athMarketCapSession: 0, // All-Time High Market Cap observed in current session from trade messages
    txs: [],                // Stores { ts: timestamp, usd: transaction_value } for *dynamic* volume calculations
    allTxData: [],          // To store all raw processed trade data for download

    // Pulse Data (from WebSocket 'update_pulse' messages)
    pulseMarketCapUSD: 0,   // Market Cap from pulse data, converted to USD
    pulseVolume24hUSD: 0,   // 24h Volume from pulse data, converted to USD
    numHolders: 0,
    liquidityUSD: 0,        // Liquidity in USD
    pulseTimestamp: 0,      // Timestamp of the last pulse update for freshness check

    // Chart Data (from XHR/Fetch)
    chartAthMarketCap: 0,   // All-Time High Market Cap calculated from historical chart data
    chartBars: [],          // Array to store all collected historical chart bars

    // Lighthouse Data (from WebSocket 'lighthouse' messages)
    lighthouse5mTotalVolume: 0 // New property for 5m total volume from lighthouse (all protocols)
};

const DataProcessor = (() => { // Wrap the data processing logic in an IIFE for module pattern

    /**
     * Processes a WebSocket 'trade' message and updates the live data state.
     * This is for individual buy/sell transactions.
     * @param {object} content The 'content' part of the WebSocket message.
     * @param {string} tokenId The ID of the token being monitored.
     */
    function processTradeMessage(content, tokenId) {
        const now = Date.now();
        const price = parseFloat(content.price_usd);
        if (isNaN(price)) {
            console.warn("[DataProcessor] Invalid price_usd received in trade message:", content.price_usd);
            return;
        }

        // Use the dynamically updated token supply, fallback to default if not yet set
        const currentSupply = dataState.tokenSupply;
        const marketCap = price * currentSupply;
        const transactionValueUsd = parseFloat(content.total_usd) || 0;

        // Store all trade events with their value and timestamp for dynamic volume calculation
        dataState.txs.push({ ts: now, usd: transactionValueUsd });

        // Keep txs array manageable (e.g., only keep last 24 hours of data for potential future use)
        const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        while (dataState.txs.length > 0 && dataState.txs[0].ts < oneDayAgo) {
            dataState.txs.shift();
        }

        if (marketCap > dataState.athMarketCapSession) {
            dataState.athMarketCapSession = marketCap;
        }

        dataState.lastPrice = price;
        dataState.lastMarketCap = marketCap;

        dataState.allTxData.push({
            timestamp: new Date(now).toISOString(),
            price_usd: price,
            total_usd_transaction: transactionValueUsd,
            pair_address: content.pair_address,
            tx_hash: content.signature,
            tx_type: content.type,
            maker_address: content.maker_address,
            liquidity_sol: content.liquidity_sol,
            liquidity_token: content.liquidity_token
        });
        console.log(`%c[DataProcessor] Trade DataState updated: Price=${Utils.formatUSD(dataState.lastPrice, 6)}, MC=${Utils.formatUSD(dataState.lastMarketCap)}, Session ATH MC=${Utils.formatUSD(dataState.athMarketCapSession)}`, 'color: blue; font-weight: bold;');
    }

    /**
     * Processes a WebSocket 'update_pulse' message for a specific token.
     * This updates general token stats and the global token supply.
     * @param {object} tokenData The specific token object from the 'content' array.
     */
    function processPulseMessage(tokenData) {
        // Update token supply if it's provided and valid
        if (typeof tokenData.supply === 'number' && tokenData.supply > 0) {
            dataState.tokenSupply = tokenData.supply;
            // console.log(`[DataProcessor] Token Supply updated to: ${dataState.tokenSupply.toLocaleString()}`); // Can uncomment for debugging
        } else if (typeof tokenData.supply === 'string') { // Try parsing if it's a string
            const parsedSupply = parseFloat(tokenData.supply);
            if (!isNaN(parsedSupply) && parsedSupply > 0) {
                dataState.tokenSupply = parsedSupply;
                // console.log(`[DataProcessor] Token Supply (parsed) updated to: ${dataState.tokenSupply.toLocaleString()}`); // Can uncomment for debugging
            }
        }

        dataState.pulseMarketCapUSD = (parseFloat(tokenData.marketCapSol) || 0) * SOL_USD_PRICE;
        dataState.pulseVolume24hUSD = (parseFloat(tokenData.volumeSol) || 0) * SOL_USD_PRICE;
        dataState.numHolders = parseInt(tokenData.numHolders) || 0;
        dataState.liquidityUSD = (parseFloat(tokenData.liquiditySol) || 0) * SOL_USD_PRICE;
        dataState.pulseTimestamp = Date.now(); // Record when this data was last updated

        console.log(`%c[DataProcessor] Pulse DataState updated: MC=${Utils.formatUSD(dataState.pulseMarketCapUSD)}, Vol24h=${Utils.formatUSD(dataState.pulseVolume24hUSD)}, Holders=${dataState.numHolders}, Liq=${Utils.formatUSD(dataState.liquidityUSD)}`, 'color: darkviolet; font-weight: bold;');
    }

    /**
     * Processes a WebSocket 'lighthouse' message.
     * This updates overall market metrics like total volume.
     * @param {object} content The 'content' part of the WebSocket message.
     */
    function processLighthouseMessage(content) {
        if (content && content['5m'] && content['5m']['All']) {
            const totalVolume = parseFloat(content['5m']['All'].totalVolume);
            if (!isNaN(totalVolume)) {
                dataState.lighthouse5mTotalVolume = totalVolume;
                console.log(`%c[DataProcessor] Lighthouse 5m Total Volume (All Protocols) updated: ${Utils.formatUSD(dataState.lighthouse5mTotalVolume)}`, 'color: #8B008B; font-weight: bold;');
            }
        }
    }

    /**
     * Processes raw chart data from an API response, filters for new bars,
     * adds them to the global dataState.chartBars array, sorts the array, and updates the ATH.
     * @param {Array} bars The 'bars' array from the chart API response.
     * @param {boolean} noData A boolean indicating if the API returned no more data.
     * @param {string} type The type of interception ('XHR' or 'Fetch') for logging purposes.
     */
    function processChartData(bars, noData, type) {


        if (Array.isArray(bars) && bars.length > 0) {
            const newBars = bars.filter(newBar =>
                !dataState.chartBars.some(existingBar => existingBar.time === newBar.time)
            );
            console.log(`%c[DataProcessor][${type}] Found ${bars.length} bars in response. Adding ${newBars.length} new unique bars.`, 'color: teal;');
            dataState.chartBars.push(...newBars);
            dataState.chartBars.sort((a, b) => a.time - b.time); // Keep bars sorted by time

            updateChartAthMarketCap(); // Recalculate ATH MC after new bars are added

            console.log(`%c[DataProcessor][${type}] Total unique chart bars collected: ${dataState.chartBars.length}`, 'color: darkgreen; font-weight: bold;');
        } else {
            console.warn(`%c[DataProcessor][${type}] Chart API response contains no 'bars' array or it's empty.`, 'color: orange;');
        }
        if (noData) {
            console.log(`%c[DataProcessor][${type}] Chart API response indicates no more data (noData: true).`, 'color: gray;');
            return;
        }
    }


    /**
     * Calculates and updates the All-Time High Market Cap from collected chart bars.
     * This should be called whenever dataState.chartBars is updated.
     */
    function updateChartAthMarketCap() {
        let maxChartPrice = 0;
        if (Array.isArray(dataState.chartBars) && dataState.chartBars.length > 0) {
            maxChartPrice = Math.max(...dataState.chartBars.map(bar => bar.high || 0));
        }

        const currentSupply = dataState.tokenSupply; // Use the dynamically updated token supply
        const maxChartMarketCap = maxChartPrice * currentSupply;

        if (maxChartMarketCap > dataState.chartAthMarketCap) {
            dataState.chartAthMarketCap = maxChartMarketCap;
            console.log(`%c[DataProcessor] Chart ATH Market Cap updated: ${Utils.formatUSD(dataState.chartAthMarketCap)}`, 'color: darkorange; font-weight: bold;');
        }
    }

    /**
     * Calculates the total volume (in USD) for a given timeframe from trade messages.
     * @param {number} minutes The timeframe in minutes (e.g., 1, 5).
     * @returns {number} The total volume in USD for the specified timeframe.
     */
    function getVolumeForTimeframe(minutes) {
        const now = Date.now();
        const timeframeMillis = minutes * 60 * 1000;
        const cutoffTime = now - timeframeMillis;

        return dataState.txs
            .filter(tx => tx.ts >= cutoffTime)
            .reduce((sum, tx) => sum + tx.usd, 0);
    }

    /**
     * Gets the current formatted data for display in the HUD.
     * @param {string} tokenId The ID of the token.
     * @returns {string} HTML string with formatted data.
     */
    function getFormattedHUDData(tokenId) {
        const { lastPrice, lastMarketCap, athMarketCapSession,
                pulseMarketCapUSD, pulseVolume24hUSD, numHolders, liquidityUSD,
                tokenSupply, lighthouse5mTotalVolume } = dataState;

        const volume1m = getVolumeForTimeframe(1);
        const volume5m = getVolumeForTimeframe(5);

        let liveTradeHtml = '';
        //                 <b>Current Price:</b> ${Utils.formatUSD(lastPrice, 6)}<br>
        if (lastPrice !== 0) {
            liveTradeHtml = `
                <b>Live Market Cap (Trades):</b> ${Utils.formatUSD(lastMarketCap)}<br>
                <b>Volume (1m / Trades):</b> ${Utils.formatUSD(volume1m)}<br>
                <b>Volume (5m / Trades):</b> ${Utils.formatUSD(volume5m)}<br>
                <b>Session ATH MC (Trades):</b> ${Utils.formatUSD(athMarketCapSession)}
            `;
        } else {
            liveTradeHtml = `Loading live trade data...`;
        }

        let pulseDataHtml = '';
        if (pulseMarketCapUSD !== 0) {
            pulseDataHtml = `
                <b>24h Market Cap (Pulse):</b> ${Utils.formatUSD(pulseMarketCapUSD, 2)}<br>
                <b>24h Total Volume (Pulse):</b> ${Utils.formatUSD(pulseVolume24hUSD, 2)}<br>
                <b>Holders:</b> ${numHolders.toLocaleString()}<br>
                <b>Liquidity:</b> ${Utils.formatUSD(liquidityUSD, 2)}
            `;
        } else {
            pulseDataHtml = `Loading token pulse data...`;
        }

        let overallMarketHtml = '';
        if (lighthouse5mTotalVolume !== 0) {
            overallMarketHtml = `
                <b>Overall Market 5m Volume:</b> ${Utils.formatUSD(lighthouse5mTotalVolume, 2)}
            `;
        } else {
            overallMarketHtml = `Loading overall market data...`;
        }

        //            <b>Token ID:</b> ${tokenId}<br>
        //             <b>Total Supply:</b> ${tokenSupply.toLocaleString()}<br><br>

        return `
        
            ${liveTradeHtml}<br><br>
            ${pulseDataHtml}<br><br>
            ${overallMarketHtml}
        `;
    }

    /**
     * Gets all collected transaction data.
     * @returns {Array<object>} An array of raw transaction objects.
     */
    function getAllTransactionData() {
        console.log(`[DataProcessor] Providing all live transaction data. Count: ${dataState.allTxData.length}`);
        return dataState.allTxData;
    }

    /**
     * Gets the current All-Time High Market Cap from chart data.
     * @returns {number} The chart ATH Market Cap.
     */
    function getChartAthMarketCap() {
        return dataState.chartAthMarketCap;
    }

    /**
     * Gets the count of collected chart bars.
     * @returns {number} The number of chart bars.
     */
    function getChartBarsCount() {
        return dataState.chartBars.length;
    }

    /**
     * Gets the time range of collected chart bars.
     * @returns {object} An object with firstBarTime and lastBarTime (formatted strings) or 'N/A'.
     */
    function getChartBarsRange() {
        const firstBarTime = dataState.chartBars.length > 0 ? new Date(dataState.chartBars[0].time).toLocaleString() : 'N/A';
        const lastBarTime = dataState.chartBars.length > 0 ? new Date(dataState.chartBars[dataState.chartBars.length - 1].time).toLocaleString() : 'N/A';
        return { firstBarTime, lastBarTime };
    }

    /**
     * Provides the collected chart data for download.
     * @returns {string} JSON string of historical chart data.
     */
    function getChartDataForDownload() {
        return JSON.stringify(dataState.chartBars, null, 2);
    }

    // Setter for SOL_USD_PRICE
    function setSolUsdPrice(price) {
        if (typeof price === 'number' && !isNaN(price) && price > 0) {
            SOL_USD_PRICE = price;
            console.log(`%c[DataProcessor] SOL_USD_PRICE updated to: $${SOL_USD_PRICE}`, 'color: green;');
        } else {
            console.warn("[DataProcessor] Attempted to set invalid SOL_USD_PRICE:", price);
        }
    }

    return {
        processTradeMessage,
        processPulseMessage,
        processLighthouseMessage,
        processChartData,
        updateChartAthMarketCap, // Exposed for external calls if needed (e.g. initial calculation after supply fetch)
        getFormattedHUDData,
        getAllTransactionData,
        getChartAthMarketCap,
        getChartBarsCount,
        getChartBarsRange,
        getChartDataForDownload,
        setSolUsdPrice
    };
})();
