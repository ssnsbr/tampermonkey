// websocket_listener.js

const WebSocketListener = (() => {
    let originalWebSocketConstructor = null;
    let dataCallback = null;
    let allowedRooms = [];

    function startListening(roomsToAllow, callback) {
        if (typeof WebSocket === 'undefined') {
            console.warn('WebSocket is not available in this environment.');
            return;
        }

        if (originalWebSocketConstructor) {
            console.warn('WebSocketListener already started. Call stopListening first if you want to restart.');
            return;
        }

        dataCallback = callback;
        allowedRooms = Array.isArray(roomsToAllow) ? roomsToAllow : [];
        // Only log the configuration, not every time it's processed
        console.log('WebSocketListener: Configured to filter for rooms:', allowedRooms);

        originalWebSocketConstructor = window.WebSocket;

        window.WebSocket = new Proxy(originalWebSocketConstructor, {
            construct(target, args) {
                const ws = new target(...args);

                ws.addEventListener('message', (event) => {
                    try {
                        const messageData = JSON.parse(event.data);
                        if (messageData && messageData.room && allowedRooms.includes(messageData.room)) {
                            if (dataCallback) {
                                dataCallback(event.data);
                            }
                        }
                        // No 'else' log for filtered messages, keeps console clean.
                    } catch (e) {
                        // Only log if the message is completely unparseable or unexpected,
                        // and not just because it lacks a 'room' or isn't a target.
                        // console.warn('WebSocketListener: Error parsing WS message or unexpected format. Ignoring.', e);
                    }
                });

                // No 'open', 'close', 'error' logs unless specifically needed for debugging.
                return ws;
            }
        });

        console.log('WebSocketListener: Proxy-based interception with room filtering active.');
    }

    function stopListening() {
        if (originalWebSocketConstructor && window.WebSocket instanceof Proxy) {
            window.WebSocket = originalWebSocketConstructor;
            originalWebSocketConstructor = null;
            dataCallback = null;
            allowedRooms = [];
            console.log('WebSocketListener: Interception stopped.');
        }
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
