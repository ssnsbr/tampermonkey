// request_listener.js
// This file is loaded via @require in main.js
// It exports an object 'RequestListener' to the global scope.

(function() {
    'use strict';

    const RequestListener = {
        /**
         * Fetches data from a given URL using the Fetch API.
         * @param {string} url - The URL to fetch data from.
         * @param {function} callback - The function to call with the fetched data (as text).
         * @returns {Promise<void>} - A promise that resolves when data is fetched or rejects on error.
         */
        fetchData: async function(url, callback) {
            if (!url) {
                console.error("RequestListener: No URL provided for fetchData.");
                return Promise.reject("No URL provided.");
            }
            if (typeof callback !== 'function') {
                console.error("RequestListener: No valid callback function provided for fetchData.");
                return Promise.reject("No valid callback.");
            }

            console.log(`RequestListener: Fetching data from ${url}...`);
            try {
                const response = await fetch(url, {
                    method: 'GET', // Or 'POST' if required
                    headers: {
                        'Accept': 'application/json', // Or other content types
                        // Add any necessary custom headers here (e.g., API keys if required)
                        // 'X-Custom-Header': 'YourValue'
                    },
                    // credentials: 'omit', // 'omit', 'same-origin', 'include'
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }

                const rawData = await response.text(); // Get raw text, let DataProcessor parse it
                callback(rawData);
                console.log(`RequestListener: Data fetched successfully from ${url}.`);
            } catch (error) {
                console.error(`RequestListener: Failed to fetch data from ${url}:`, error);
                throw error; // Re-throw to allow main.js to catch it
            }
        },

        /**
         * Sends data to a given URL using a POST request.
         * @param {string} url - The URL to send data to.
         * @param {object} payload - The data object to send (will be JSON.stringified).
         * @returns {Promise<any>} - A promise that resolves with the response data (parsed JSON) or rejects on error.
         */
        sendData: async function(url, payload) {
            if (!url || !payload) {
                console.error("RequestListener: URL or payload missing for sendData.");
                return Promise.reject("URL or payload missing.");
            }

            console.log(`RequestListener: Sending data to ${url}...`, payload);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        // Add any necessary custom headers here
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }

                // Assuming the response is JSON, parse it
                const responseData = await response.json();
                console.log(`RequestListener: Data sent successfully to ${url}. Response:`, responseData);
                return responseData;
            } catch (error) {
                console.error(`RequestListener: Failed to send data to ${url}:`, error);
                throw error;
            }
        }
        // You can add more specific request functions here (e.g., for specific API calls)
    };

    // Expose RequestListener to the global scope
    window.RequestListener = RequestListener;

})();
