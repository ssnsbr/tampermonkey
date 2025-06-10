// request_listener.js

const RequestListener = (() => {
    let originalXHRopen = null;
    let originalXHRsend = null;
    let originalFetch = null;
    let responseCallback = null; // Callback for processed response data

    function startListening(callback) {
        if (originalXHRopen || originalFetch) {
            console.warn('[RequestListener] RequestListener already started.');
            return;
        }

        responseCallback = callback;

        // XHR Interception
        originalXHRopen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this._url = url; // Store the URL
            return originalXHRopen.apply(this, arguments);
        };

        originalXHRsend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            this.addEventListener('load', function() {
                if (this.readyState === 4 && this.status >= 200 && this.status < 300 && responseCallback) {
                    try {
                        const data = JSON.parse(this.responseText);
                        responseCallback(this._url, data, 'XHR');
                    } catch (e) {
                        // Suppress logs for non-JSON or irrelevant XHR responses to keep console clean
                    }
                }
            });
            return originalXHRsend.apply(this, arguments);
        };
        console.log('[RequestListener] Proxy-based XMLHttpRequest interception active.');


        // Fetch Interception
        originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [resource] = args;
            let requestUrl = null;

            if (typeof resource === 'string') {
                requestUrl = resource;
            } else if (resource instanceof Request) {
                requestUrl = resource.url;
            } else if (resource instanceof URL) {
                requestUrl = resource.href;
            }

            try {
                const response = await originalFetch.apply(this, args);
                if (!response.ok) {
                    // Suppress logs for non-OK responses to keep console clean
                    return response; // Return original response if not OK
                }
                const clone = response.clone();
                if (responseCallback) {
                    try {
                        const data = await clone.json();
                        responseCallback(requestUrl, data, 'Fetch');
                    } catch (e) {
                        // Suppress logs for non-JSON or irrelevant fetch responses to keep console clean
                    }
                }
                return response; // Return original response
            } catch (error) {
                // Suppress network errors unless critical for debugging
                throw error; // Re-throw the error
            }
        };
        console.log('[RequestListener] Proxy-based Fetch API interception active.');
    }

    function stopListening() {
        if (originalXHRopen) {
            XMLHttpRequest.prototype.open = originalXHRopen;
            XMLHttpRequest.prototype.send = originalXHRsend;
            originalXHRopen = null;
            originalXHRsend = null;
            console.log('[RequestListener] XMLHttpRequest interception stopped.');
        }
        if (originalFetch) {
            window.fetch = originalFetch;
            originalFetch = null;
            console.log('[RequestListener] Fetch API interception stopped.');
        }
        responseCallback = null;
    }

    return {
        startListening: startListening,
        stopListening: stopListening,
    };
})();
