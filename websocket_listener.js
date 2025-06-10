// websocket_listener.js

const WebSocketListener = (() => {
    let originalWebSocketConstructor = null;
    let messageCallback = null;
    let allowedRooms = [];

    function startListening(roomsToAllow, callback) {
        if (typeof WebSocket === 'undefined') {
            console.warn('[WebSocketListener] WebSocket is not available in this environment.');
            return;
        }

        if (originalWebSocketConstructor) {
            console.warn('[WebSocketListener] WebSocketListener already started. Call stopListening first if you want to restart.');
            return;
        }

        messageCallback = callback;
        allowedRooms = Array.isArray(roomsToAllow) ? roomsToAllow : [];
        console.log('[WebSocketListener] Configured to filter for rooms:', allowedRooms);

        originalWebSocketConstructor = window.WebSocket;

        window.WebSocket = new Proxy(originalWebSocketConstructor, {
            construct(target, args) {
                const ws = new target(...args);

                ws.addEventListener('message', (event) => {
                    try {
                        const messageData = JSON.parse(event.data);
                        // Check if message has a 'room' property and if it's in our allowed list
                        // Also check for 'pair_address' for messages like trades that don't always have 'room'
                        if ((messageData && messageData.room && allowedRooms.includes(messageData.room)) ||
                            (messageData && messageData.content && messageData.content.pair_address && allowedRooms.includes(messageData.content.pair_address))) {
                            if (messageCallback) {
                                messageCallback(event.data); // Pass the raw data string for Main to parse/dispatch
                            }
                        }
                    } catch (e) {
                        // Suppress logs for non-JSON or irrelevant WS messages to keep console clean
                    }
                });
                return ws;
            }
        });

        console.log('[WebSocketListener] Proxy-based interception with room filtering active.');
    }

    function stopListening() {
        if (originalWebSocketConstructor && window.WebSocket instanceof Proxy) {
            window.WebSocket = originalWebSocketConstructor;
            originalWebSocketConstructor = null;
            messageCallback = null;
            allowedRooms = [];
            console.log('[WebSocketListener] Interception stopped.');
        }
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
