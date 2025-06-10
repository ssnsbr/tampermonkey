// ui.js
// This file contains functions to create and manage the floating UI.

/**
 * Creates and appends a floating UI container with given elements and makes it draggable.
 * @param {HTMLElement[]} elements An array of HTML elements to append to the UI body.
 * @param {object} callbacks An object containing callback functions for button clicks.
 * @param {Function} callbacks.onDownloadJson Click handler for JSON download button.
 * @param {Function} callbacks.onDownloadPandas Click handler for Pandas download button.
 * @returns {HTMLElement} The created UI container.
 */
function createFloatingUI(elements, callbacks) {
    // Main container for the floating UI
    const uiContainer = document.createElement('div');
    uiContainer.id = 'axiom-hud-container';
    uiContainer.style.position = 'fixed';
    uiContainer.style.top = '20px';
    uiContainer.style.right = '20px';
    uiContainer.style.width = '300px'; // Adjusted width for buttons
    uiContainer.style.backgroundColor = 'rgba(0,0,0,0.9)';
    uiContainer.style.color = 'lime';
    uiContainer.style.fontSize = '16px';
    uiContainer.style.fontFamily = 'monospace';
    uiContainer.style.padding = '15px';
    uiContainer.style.borderRadius = '8px';
    uiContainer.style.boxShadow = '0 0 10px lime';
    uiContainer.style.zIndex = '999999';
    uiContainer.style.cursor = 'grab'; // Indicates it's draggable
    uiContainer.style.resize = 'both'; // Allow resizing
    uiContainer.style.overflow = 'auto'; // Add scrollbars if content overflows

    // Header for moving the UI
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    header.style.cursor = 'grab';
    header.innerText = 'Axiom Token HUD';
    uiContainer.appendChild(header);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'lime';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => uiContainer.remove();
    uiContainer.appendChild(closeBtn);

    // Content area for dynamic data
    const contentArea = document.createElement('div');
    contentArea.id = 'hud-content-area';
    uiContainer.appendChild(contentArea);

    // Append the initial elements
    elements.forEach(el => contentArea.appendChild(el));

    // Download Buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'center';

    const downloadJsonBtn = document.createElement('button');
    downloadJsonBtn.textContent = 'Download JSON';
    downloadJsonBtn.style.cssText = `
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    downloadJsonBtn.onmouseover = (e) => e.target.style.backgroundColor = '#0056b3';
    downloadJsonBtn.onmouseout = (e) => e.target.style.backgroundColor = '#007bff';
    downloadJsonBtn.onclick = callbacks.onDownloadJson;
    buttonContainer.appendChild(downloadJsonBtn);

    const downloadPandasBtn = document.createElement('button');
    downloadPandasBtn.textContent = 'Download CSV (Pandas)';
    downloadPandasBtn.style.cssText = `
        background-color: #28a745;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    downloadPandasBtn.onmouseover = (e) => e.target.style.backgroundColor = '#218838';
    downloadPandasBtn.onmouseout = (e) => e.target.style.backgroundColor = '#28a745';
    downloadPandasBtn.onclick = callbacks.onDownloadPandas;
    buttonContainer.appendChild(downloadPandasBtn);

    uiContainer.appendChild(buttonContainer);

    // Make the UI draggable
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - uiContainer.getBoundingClientRect().left;
        offsetY = e.clientY - uiContainer.getBoundingClientRect().top;
        uiContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        uiContainer.style.left = `${e.clientX - offsetX}px`;
        uiContainer.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        uiContainer.style.cursor = 'grab';
    });

    document.body.appendChild(uiContainer);
    return uiContainer;
}

/**
 * Updates the content of the HUD.
 * @param {string} htmlContent The HTML string to set as the innerHTML of the content area.
 */
function updateHUDContent(htmlContent) {
    const contentArea = document.getElementById('hud-content-area');
    if (contentArea) {
        contentArea.innerHTML = htmlContent;
    }
}
