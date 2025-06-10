// websocket_listener.js
// This file is loaded via @require in main.js
// It exports an object 'WebSocketListener' to the global scope.

(function() {
    'use strict';

    let ws = null;
    let dataCallback = null; // Callback to send processed data back to main.js or data_processor
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_INTERVAL_MS = 5000; // 5 seconds

    const WebSocketListener = {
        init: function(url, callback) {
            if (!url) {
                console.error("WebSocketListener: No WebSocket URL provided.");
                return;
            }
            if (typeof callback !== 'function') {
                console.error("WebSocketListener: No valid callback function provided.");
                return;
            }

            this.url = url;
            dataCallback = callback;
            this._connect();
        },

        _connect: function() {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                console.warn("WebSocketListener: Already connected or connecting. Skipping new connection.");
                return;
            }

            console.log(`WebSocketListener: Attempting to connect to ${this.url}...`);
            ws = new WebSocket(this.url);

            ws.onopen = (event) => {
                console.log("WebSocketListener: Connected.", event);
                reconnectAttempts = 0; // Reset attempts on successful connection
                // You might send an initial message here if the server expects one
                // ws.send(JSON.stringify({ type: "subscribe", channel: "market_data" }));
            };

            ws.onmessage = (event) => {
                // Pass the raw data to the callback (which usually goes to DataProcessor)
                dataCallback(event.data);
            };

            ws.onclose = (event) => {
                console.warn("WebSocketListener: Disconnected.", event);
                ws = null; // Clear the WebSocket instance
                if (event.code !== 1000) { // 1000 is normal closure
                    this._reconnect();
                }
            };

            ws.onerror = (error) => {
                console.error("WebSocketListener: Error:", error);
                ws.close(); // Force close to trigger onclose and potential reconnect
            };
        },

        _reconnect: function() {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`WebSocketListener: Reconnecting in ${RECONNECT_INTERVAL_MS / 1000} seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(() => this._connect(), RECONNECT_INTERVAL_MS);
            } else {
                console.error("WebSocketListener: Max reconnect attempts reached. Giving up.");
            }
        },

        sendMessage: function(message) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            } else {
                console.warn("WebSocketListener: WebSocket not open. Cannot send message:", message);
            }
        },

        close: function() {
            if (ws) {
                console.log("WebSocketListener: Closing connection.");
                ws.close(1000, "Script shutdown"); // 1000 indicates normal closure
                ws = null;
            }
        }
    };

    // Expose WebSocketListener to the global scope
    window.WebSocketListener = WebSocketListener;

})();
