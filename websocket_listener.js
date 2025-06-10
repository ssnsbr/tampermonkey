// websocket_listener.js

const WebSocketListener = (() => {
    let originalWebSocketConstructor = null; // Store the original WebSocket constructor
    let dataCallback = null;

    function startListening(callback) {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket is not available in this environment.');
            return;
        }

        if (originalWebSocketConstructor) {
            console.warn('WebSocketListener already started. Call stopListening first if you want to restart.');
            return;
        }

        dataCallback = callback; // Store the callback to send data to main.js

        // Store the original WebSocket constructor
        originalWebSocketConstructor = window.WebSocket;

        // Create a Proxy for the WebSocket constructor
        window.WebSocket = new Proxy(originalWebSocketConstructor, {
            construct(target, args) {
                // 'target' is the original WebSocket constructor
                // 'args' are the arguments passed to 'new WebSocket(...)'

                const ws = new target(...args); // Create the actual WebSocket instance using the original constructor

                // Intercept messages on the newly created WebSocket instance
                ws.addEventListener('message', (event) => {
                    // IMPORTANT: Your existing logic to filter relevant WebSocket messages goes here.
                    // Only pass relevant data to the callback.
                    // Example: if (event.target.url.includes('some_relevant_endpoint')) { ... }
                    // or if (event.data.includes('some_identifying_string')) { ... }

                    // Pass the raw message data to the registered callback in main.js
                    if (dataCallback) {
                        dataCallback(event.data);
                    }
                });

                // You can also add listeners for 'open', 'close', 'error' if needed for logging/debugging
                // These will still attach to the actual WebSocket instance
                // ws.addEventListener('open', (event) => {
                //     console.log('Intercepted WebSocket opened:', event.target.url);
                // });
                // ws.addEventListener('close', (event) => {
                //     console.log('Intercepted WebSocket closed:', event.target.url, event.code, event.reason);
                // });
                // ws.addEventListener('error', (event) => {
                //     console.error('Intercepted WebSocket error:', event.target.url, event);
                // });

                return ws; // Return the actual WebSocket instance
            }
        });

        console.log('WebSocketListener: Proxy-based interception active.');
    }

    function stopListening() {
        if (originalWebSocketConstructor && window.WebSocket instanceof Proxy) {
            window.WebSocket = originalWebSocketConstructor; // Restore original WebSocket
            originalWebSocketConstructor = null;
            dataCallback = null;
            console.log('WebSocketListener: Interception stopped.');
        }
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
