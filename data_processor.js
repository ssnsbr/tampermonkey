// data_processor.js
// Encapsulates logic for processing WebSocket data and maintaining state.

console.log("[DataProcessor] Initializing data_processor.js");

// --- Configuration ---
const TOTAL_SUPPLY_BILLION = 1_000_000_000;
// IMPORTANT: This SOL_USD_PRICE is a placeholder. You might need to fetch this dynamically
// from another API (e.g., CoinGecko, CoinMarketCap) or find it on the Axiom page itself.
let SOL_USD_PRICE = 150; // Placeholder: Assume 1 SOL = $150 USD for now

// --- Data State ---
const dataState = {
    // Live Trade Data (from WebSocket 'trade' messages)
    lastPrice: 0,           // Last known price in USD from trade messages
    lastMarketCap: 0,       // Last calculated market cap in USD from trade messages (price * supply)
    volume24h: 0,           // Sum of transaction USD values over 24 hours from trade messages
    athMarketCapSession: 0, // All-Time High Market Cap observed in current session from trade messages
    txs: [],                // Stores { ts: timestamp, usd: transaction_value } for 24h volume calc
    allTxData: [],          // To store all raw processed trade data for download

    // Pulse Data (from WebSocket 'update_pulse' messages)
    pulseMarketCapUSD: 0,   // Market Cap from pulse data, converted to USD
    pulseVolume24hUSD: 0,   // 24h Volume from pulse data, converted to USD
    numHolders: 0,
    liquidityUSD: 0,        // Liquidity in USD
    pulseTimestamp: 0,      // Timestamp of the last pulse update for freshness check

    // Chart Data (from XHR/Fetch)
    chartAthMarketCap: 0    // All-Time High Market Cap calculated from historical chart data
};

// --- Utility Functions ---

/**
 * Formats a number as USD with M/K suffixes or fixed decimals.
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

/**
 * Processes a WebSocket 'trade' message and updates the live data state.
 * This is for individual buy/sell transactions.
 * @param {object} content The 'content' part of the WebSocket message.
 * @param {string} tokenId The ID of the token being monitored.
 */
function processTradeMessage(content, tokenId) {
    // console.log("[DataProcessor] processTradeMessage called.");
    // console.log("[DataProcessor] Incoming trade content:", content);

    const now = Date.now();
    const price = parseFloat(content.price_usd);
    if (isNaN(price)) {
        console.warn("[DataProcessor] Invalid price_usd received in trade message:", content.price_usd);
        return;
    }

    const marketCap = price * TOTAL_SUPPLY_BILLION;
    const transactionValueUsd = parseFloat(content.total_usd) || 0;

    dataState.txs.push({ ts: now, usd: transactionValueUsd });
    const oneDayAgo = now - 86400000;
    while (dataState.txs.length && dataState.txs[0].ts < oneDayAgo) {
        dataState.txs.shift();
    }
    dataState.volume24h = dataState.txs.reduce((sum, tx) => sum + tx.usd, 0);

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
    // console.log(`%c[DataProcessor] Trade DataState updated: Price=${formatUSD(dataState.lastPrice)}, MC=${formatUSD(dataState.lastMarketCap)}, Vol24h=${formatUSD(dataState.volume24h)}, Session ATH MC=${formatUSD(dataState.athMarketCapSession)}`, 'color: blue; font-weight: bold;');
}

/**
 * Processes a WebSocket 'update_pulse' message for a specific token.
 * This updates general token stats.
 * @param {object} tokenData The specific token object from the 'content' array.
 */
function processPulseMessage(tokenData) {
    // console.log("[DataProcessor] Processing pulse message for token:", tokenData.tokenName);

    dataState.pulseMarketCapUSD = (parseFloat(tokenData.marketCapSol) || 0) * SOL_USD_PRICE;
    dataState.pulseVolume24hUSD = (parseFloat(tokenData.volumeSol) || 0) * SOL_USD_PRICE;
    dataState.numHolders = parseInt(tokenData.numHolders) || 0;
    dataState.liquidityUSD = (parseFloat(tokenData.liquiditySol) || 0) * SOL_USD_PRICE;
    dataState.pulseTimestamp = Date.now(); // Record when this data was last updated

    // console.log(`%c[DataProcessor] Pulse DataState updated: MC=${formatUSD(dataState.pulseMarketCapUSD)}, Vol24h=${formatUSD(dataState.pulseVolume24hUSD)}, Holders=${dataState.numHolders}, Liq=${formatUSD(dataState.liquidityUSD)}`, 'color: darkviolet; font-weight: bold;');
}

/**
 * Calculates and updates the All-Time High Market Cap from collected chart bars.
 * This should be called whenever allChartBars is updated.
 * @param {Array<object>} allChartBars The array of historical chart bars.
 */
function updateChartAthMarketCap(allChartBars) {
    let maxChartMarketCap = 0;
    if (Array.isArray(allChartBars) && allChartBars.length > 0) {
        const maxPrice = Math.max(...allChartBars.map(bar => bar.high || 0));
        maxChartMarketCap = maxPrice * TOTAL_SUPPLY_BILLION;
    }

    if (maxChartMarketCap > dataState.chartAthMarketCap) {
        dataState.chartAthMarketCap = maxChartMarketCap;
        console.log(`%c[DataProcessor] Chart ATH Market Cap updated: ${formatUSD(dataState.chartAthMarketCap)}`, 'color: darkorange; font-weight: bold;');
    }
}

/**
 * Gets the current formatted data for display in the HUD.
 * @param {string} tokenId The ID of the token.
 * @returns {string} HTML string with formatted data.
 */
function getFormattedHUDData(tokenId) {
    const { lastPrice, lastMarketCap, volume24h, athMarketCapSession,
            pulseMarketCapUSD, pulseVolume24hUSD, numHolders, liquidityUSD,
            chartAthMarketCap } = dataState;

    // console.log(`[DataProcessor] getFormattedHUDData called.`);

    let liveTradeHtml = '';
    if (lastPrice !== 0) {
        liveTradeHtml = `
            <b>Current Price:</b> ${formatUSD(lastPrice, 6)}<br>
            <b>Live Market Cap (Trades):</b> ${formatUSD(lastMarketCap)}<br>
            <b>24h Live Volume (Trades):</b> ${formatUSD(volume24h)}<br>
            <b>Session ATH MC (Trades):</b> ${formatUSD(athMarketCapSession)}
        `;
    } else {
        liveTradeHtml = `Loading live trade data...`;
    }

    let pulseDataHtml = '';
    if (pulseMarketCapUSD !== 0) {
        pulseDataHtml = `
            <b>24h Market Cap:</b> ${formatUSD(pulseMarketCapUSD, 2)}<br>
            <b>24h Total Volume:</b> ${formatUSD(pulseVolume24hUSD, 2)}<br>
            <b>Holders:</b> ${numHolders.toLocaleString()}<br>
            <b>Liquidity:</b> ${formatUSD(liquidityUSD, 2)}
        `;
    } else {
        pulseDataHtml = `Loading token pulse data...`;
    }

    return `
        <b>Token:</b> ${tokenId}<br>
        ${liveTradeHtml}<br>
        ${pulseDataHtml}<br>
        <b>Chart ATH MC:</b> ${formatUSD(chartAthMarketCap)}
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

// You can add a setter for SOL_USD_PRICE if you plan to fetch it dynamically
function setSolUsdPrice(price) {
    if (typeof price === 'number' && !isNaN(price) && price > 0) {
        SOL_USD_PRICE = price;
        console.log(`%c[DataProcessor] SOL_USD_PRICE updated to: $${SOL_USD_PRICE}`, 'color: green;');
        // Recalculate pulse data to reflect new SOL price if desired, or wait for next pulse
        // For simplicity, we'll let the next pulse message update these values
    } else {
        console.warn("[DataProcessor] Attempted to set invalid SOL_USD_PRICE:", price);
    }
}

