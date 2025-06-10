// ui.js

const UI_Manager = (() => {
    let hudContainer; // Reference to the main HUD container

    // Function to create and append the initial HUD structure
    function init() {
        if (hudContainer) {
            console.log('UI_Manager: HUD already initialized.');
            return; // Prevent re-initialization
        }

        hudContainer = document.createElement('div');
        hudContainer.id = 'axiom-token-hud';
        // Add basic styling for positioning, etc.
        hudContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(30, 30, 30, 0.9);
            color: #fff;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-family: sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            backdrop-filter: blur(5px); /* Modern frosted glass effect */
            -webkit-backdrop-filter: blur(5px);
        `;

        hudContainer.innerHTML = `
            <h3>Token Stats</h3>
            <p>Market Cap: <span id="hud-marketcap">---</span></p>
            <p>Volume (24h): <span id="hud-volume">---</span></p>
            <p>ATH: <span id="hud-ath">---</span></p>
            <button id="downloadChartDataBtn" style="
                background-color: #007bff;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
                font-size: 13px;
            ">Download Chart Data</button>
            <div id="chart-data-status" style="margin-top: 5px; font-size: 12px; color: #aaa;"></div>
        `;

        document.body.appendChild(hudContainer);
        console.log('UI_Manager: HUD initialized and appended to body.');
    }

    // Function to update the HUD with new data
    function updateHUD(data) {
        if (!hudContainer) {
            console.warn('UI_Manager: HUD container not found. Call init() first.');
            // Attempt to initialize if not already, though main.js should handle this.
            init();
            if (!hudContainer) return; // If still not initialized, something is wrong.
        }

        const marketCapSpan = document.getElementById('hud-marketcap');
        const volumeSpan = document.getElementById('hud-volume');
        const athSpan = document.getElementById('hud-ath');

        if (marketCapSpan) {
            marketCapSpan.textContent = data.marketCap || '---';
        }
        if (volumeSpan) {
            volumeSpan.textContent = data.volume || '---';
        }
        if (athSpan) {
            athSpan.textContent = data.ath || '---';
        }
    }

    // Function to update chart data status or display messages
    function updateChartDataStatus(message) {
        const statusDiv = document.getElementById('chart-data-status');
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    }

    return {
        init: init,
        updateHUD: updateHUD,
        updateChartDataStatus: updateChartDataStatus,
    };
})();
