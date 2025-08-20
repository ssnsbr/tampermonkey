// rsi_calculator.js
// RSI Calculator using Wilder's Smoothing Method (matches TradingView)

class RSICalculator {
    constructor(period = 14) {
        this.period = period;
        this.previousClose = null;
        this.avgGain = null;
        this.avgLoss = null;
        this.rsiHistory = [];
        this.priceHistory = [];
        this.isInitialized = false;
        this.initialGains = [];
        this.initialLosses = [];
    }

    /**
     * Add a new price point and calculate RSI using Wilder's Smoothing
     * This method matches TradingView's RSI calculation
     * @param {number} price - Current price
     * @param {number} timestamp - Optional timestamp
     * @returns {number|null} - RSI value or null if not enough data
     */
    addPrice(price, timestamp = null) {
        if (typeof price !== 'number' || price <= 0) {
            return null;
        }

        this.priceHistory.push({
            price: price,
            timestamp: timestamp || Date.now()
        });

        // Keep only last 200 price points for memory efficiency
        if (this.priceHistory.length > 200) {
            this.priceHistory.shift();
        }

        if (this.previousClose === null) {
            this.previousClose = price;
            return null;
        }

        const change = price - this.previousClose;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        if (!this.isInitialized) {
            // Collect initial period values for first calculation
            this.initialGains.push(gain);
            this.initialLosses.push(loss);

            if (this.initialGains.length === this.period) {
                // First RSI calculation using Simple Moving Average
                this.avgGain = this.initialGains.reduce((sum, g) => sum + g, 0) / this.period;
                this.avgLoss = this.initialLosses.reduce((sum, l) => sum + l, 0) / this.period;
                this.isInitialized = true;
            }
        } else {
            // Use Wilder's Smoothing Method (like TradingView)
            // avgGain = (previousAvgGain * (period - 1) + currentGain) / period
            this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
            this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
        }

        this.previousClose = price;

        if (!this.isInitialized) {
            return null;
        }

        // Calculate RSI
        let rsi;
        if (this.avgLoss === 0) {
            rsi = 100;
        } else {
            const rs = this.avgGain / this.avgLoss;
            rsi = 100 - (100 / (1 + rs));
        }

        // Store RSI history
        this.rsiHistory.push({
            price: price,
            rsi: rsi,
            timestamp: timestamp || Date.now(),
            avgGain: this.avgGain,
            avgLoss: this.avgLoss
        });

        // Keep only last 100 RSI values
        if (this.rsiHistory.length > 100) {
            this.rsiHistory.shift();
        }

        return rsi;
    }

    /**
     * Process multiple historical prices at once (for chart data)
     * @param {Array} priceData - Array of {price, timestamp} or just prices
     */
    processHistoricalData(priceData) {
        console.log(`[RSI] Processing ${priceData.length} historical price points`);
        
        priceData.forEach((item, index) => {
            let price, timestamp;
            
            if (typeof item === 'object') {
                price = item.close || item.price;
                timestamp = item.time || item.timestamp;
            } else {
                price = item;
                timestamp = Date.now() - (priceData.length - index) * 60000; // Assume 1min intervals
            }
            
            if (price && typeof price === 'number') {
                this.addPrice(price, timestamp);
            }
        });

        const currentRSI = this.getCurrentRSI();
        if (currentRSI !== null) {
            console.log(`[RSI] Historical processing complete. Final RSI: ${currentRSI.toFixed(2)}`);
        }
    }

    /**
     * Get current RSI value
     * @returns {number|null}
     */
    getCurrentRSI() {
        if (this.rsiHistory.length === 0) return null;
        return this.rsiHistory[this.rsiHistory.length - 1].rsi;
    }

    /**
     * Get RSI color based on value and thresholds
     * @param {number} rsi - RSI value
     * @param {number} oversoldThreshold - Oversold threshold (default 30)
     * @param {number} overboughtThreshold - Overbought threshold (default 70)
     * @returns {string} - Color string
     */
    static getRSIColor(rsi, oversoldThreshold = 30, overboughtThreshold = 70) {
        if (rsi === null || rsi === undefined) return '#888888';
        if (rsi < oversoldThreshold) return '#00ff00'; // Green for oversold
        if (rsi > overboughtThreshold) return '#ff0000'; // Red for overbought
        return '#ffff00'; // Yellow for neutral
    }

    /**
     * Get RSI status text
     * @param {number} rsi - RSI value
     * @param {number} oversoldThreshold - Oversold threshold
     * @param {number} overboughtThreshold - Overbought threshold
     * @returns {string} - Status text
     */
    static getRSIStatus(rsi, oversoldThreshold = 30, overboughtThreshold = 70) {
        if (rsi === null || rsi === undefined) return 'Calculating...';
        if (rsi < oversoldThreshold) return 'Oversold';
        if (rsi > overboughtThreshold) return 'Overbought';
        return 'Neutral';
    }

    /**
     * Reset the calculator
     */
    reset() {
        this.previousClose = null;
        this.avgGain = null;
        this.avgLoss = null;
        this.rsiHistory = [];
        this.priceHistory = [];
        this.isInitialized = false;
        this.initialGains = [];
        this.initialLosses = [];
    }

    /**
     * Get configuration info
     */
    getConfig() {
        return {
            period: this.period,
            isInitialized: this.isInitialized,
            dataPoints: this.rsiHistory.length,
            currentRSI: this.getCurrentRSI()
        };
    }

    /**
     * Export all RSI data for downloads
     */
    exportData() {
        return {
            config: this.getConfig(),
            rsiHistory: this.rsiHistory,
            priceHistory: this.priceHistory
        };
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.RSICalculator = RSICalculator;
}
