// ui.js
// This file contains functions to create and manage the floating UI.

/**
 * Creates and appends a floating UI container.
 * It's now more generic to allow multiple content and button sections.
 * @param {object} sections An array of objects, each defining a section { id: string, title: string, elements: HTMLElement[], callbacks: object }.
 * callbacks: { onDownloadJson: Function, onDownloadPandas: Function } for each section.
 * @returns {HTMLElement} The created UI container.
 */
function createFloatingUI(sections) {
    // Main container for the floating UI
    const uiContainer = document.createElement('div');
    uiContainer.id = 'axiom-hud-container';
    uiContainer.style.position = 'fixed';
    uiContainer.style.top = '50px';
    uiContainer.style.right = '20px';
    uiContainer.style.width = '320px'; // Adjusted width for more content/buttons
    uiContainer.style.backgroundColor = 'rgba(0,0,0,0.4)';
    uiContainer.style.color = 'lime';
    uiContainer.style.fontSize = '14px'; // Slightly smaller font for more info
    uiContainer.style.fontFamily = 'monospace';
    uiContainer.style.padding = '15px';
    uiContainer.style.borderRadius = '8px';
    uiContainer.style.boxShadow = '0 0 10px lime';
    uiContainer.style.zIndex = '999999';
    uiContainer.style.cursor = 'grab'; // Indicates it's draggable
    uiContainer.style.resize = 'both'; // Allow resizing
    uiContainer.style.overflow = 'auto'; // Add scrollbars if content overflows
    uiContainer.style.maxHeight = '90vh'; // Prevent it from going off-screen vertically
    uiContainer.style.transition = 'all 0.3s ease'; // Smooth transitions

    // Header for moving the UI
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '10px';
    header.style.cursor = 'grab';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    
    const title = document.createElement('span');
    title.innerText = 'Axiom Token Data HUD';
    title.style.flex = '1';
    title.style.textAlign = 'center';
    
    // Expand/Collapse button
    const expandBtn = document.createElement('button');
    expandBtn.textContent = '−'; // Minimize symbol
    expandBtn.style.background = 'none';
    expandBtn.style.border = '1px solid lime';
    expandBtn.style.color = 'lime';
    expandBtn.style.fontSize = '16px';
    expandBtn.style.cursor = 'pointer';
    expandBtn.style.width = '25px';
    expandBtn.style.height = '25px';
    expandBtn.style.borderRadius = '3px';
    expandBtn.style.marginRight = '5px';
    expandBtn.title = 'Minimize/Expand';

    header.appendChild(expandBtn);
    header.appendChild(title);
    uiContainer.appendChild(header);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'lime';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = () => uiContainer.remove();
    uiContainer.appendChild(closeBtn);

    // Content container (what gets hidden/shown)
    const contentContainer = document.createElement('div');
    contentContainer.id = 'hud-content-container';
    contentContainer.style.transition = 'all 0.3s ease';
    
    // Track collapsed state
    let isCollapsed = false;

    // Expand/Collapse functionality
    expandBtn.onclick = () => {
        isCollapsed = !isCollapsed;
        
        if (isCollapsed) {
            // Collapse
            contentContainer.style.maxHeight = '0';
            contentContainer.style.overflow = 'hidden';
            contentContainer.style.padding = '0';
            contentContainer.style.margin = '0';
            expandBtn.textContent = '+';
            expandBtn.title = 'Expand';
            uiContainer.style.height = 'auto';
            uiContainer.style.minHeight = '60px';
        } else {
            // Expand
            contentContainer.style.maxHeight = 'none';
            contentContainer.style.overflow = 'visible';
            contentContainer.style.padding = '';
            contentContainer.style.margin = '';
            expandBtn.textContent = '−';
            expandBtn.title = 'Minimize';
            uiContainer.style.minHeight = '';
        }
    };

    // Add sections dynamically to the content container
    sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.id = section.id; // e.g., 'hud-live-data-section' or 'hud-chart-data-section'
        sectionDiv.style.marginBottom = '20px';
        sectionDiv.style.borderTop = '1px solid rgba(0,255,0,0.3)';
        sectionDiv.style.paddingTop = '10px';
        sectionDiv.style.position = 'relative'; // For title absolute positioning

        const sectionTitle = document.createElement('div');
        sectionTitle.style.fontWeight = 'bold';
        sectionTitle.style.color = 'lime';
        sectionTitle.style.backgroundColor = 'rgba(0,0,0,0.9)';
        sectionTitle.style.position = 'absolute';
        sectionTitle.style.top = '-10px'; // Move title slightly above the border
        sectionTitle.style.left = '50%';
        sectionTitle.style.transform = 'translateX(-50%)';
        sectionTitle.style.padding = '0 5px';
        sectionTitle.textContent = section.title;
        sectionDiv.appendChild(sectionTitle);

        // Content area for dynamic data
        const contentArea = document.createElement('div');
        contentArea.id = `${section.id}-content`; // e.g., 'hud-live-data-section-content'
        sectionDiv.appendChild(contentArea);

        // Append the initial elements
        section.elements.forEach(el => contentArea.appendChild(el));

        // Download Buttons container (if callbacks are provided)
        if (section.callbacks && (section.callbacks.onDownloadJson || section.callbacks.onDownloadPandas)) {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.marginTop = '15px';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.justifyContent = 'center';

            if (section.callbacks.onDownloadJson) {
                const downloadJsonBtn = document.createElement('button');
                downloadJsonBtn.textContent = 'Download JSON';
                downloadJsonBtn.style.cssText = `
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 13px;
                `;
                downloadJsonBtn.onmouseover = (e) => e.target.style.backgroundColor = '#0056b3';
                downloadJsonBtn.onmouseout = (e) => e.target.style.backgroundColor = '#007bff';
                downloadJsonBtn.onclick = section.callbacks.onDownloadJson;
                buttonContainer.appendChild(downloadJsonBtn);
            }

            if (section.callbacks.onDownloadPandas) {
                const downloadPandasBtn = document.createElement('button');
                downloadPandasBtn.textContent = 'Download CSV'; // Renamed from Pandas for brevity
                downloadPandasBtn.style.cssText = `
                    background-color: #28a745;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 13px;
                `;
                downloadPandasBtn.onmouseover = (e) => e.target.style.backgroundColor = '#218838';
                downloadPandasBtn.onmouseout = (e) => e.target.style.backgroundColor = '#28a745';
                downloadPandasBtn.onclick = section.callbacks.onDownloadPandas;
                buttonContainer.appendChild(downloadPandasBtn);
            }
            sectionDiv.appendChild(buttonContainer);
        }
        contentContainer.appendChild(sectionDiv);
    });

    uiContainer.appendChild(contentContainer);

    // Make the UI draggable
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        // Don't start dragging if clicking on buttons
        if (e.target === expandBtn || e.target === closeBtn) return;
        
        isDragging = true;
        offsetX = e.clientX - uiContainer.getBoundingClientRect().left;
        offsetY = e.clientY - uiContainer.getBoundingClientRect().top;
        uiContainer.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        uiContainer.style.left = `${e.clientX - offsetX}px`;
        uiContainer.style.top = `${e.clientY - offsetY}px`;
        uiContainer.style.right = 'auto'; // Remove right positioning when dragging
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        uiContainer.style.cursor = 'grab';
    });

    document.body.appendChild(uiContainer);
    return uiContainer;
}

/**
 * Updates the content of a specific HUD section.
 * @param {string} sectionId The ID of the section (e.g., 'hud-live-data-section').
 * @param {string} htmlContent The HTML string to set as the innerHTML of the content area.
 */
function updateHUDContent(sectionId, htmlContent) {
    const contentArea = document.getElementById(`${sectionId}-content`);
    if (contentArea) {
        contentArea.innerHTML = htmlContent;
    }
}

/**
 * Programmatically collapse or expand the HUD
 * @param {boolean} collapse - true to collapse, false to expand
 */
function setHUDCollapsed(collapse = true) {
    const container = document.getElementById('axiom-hud-container');
    const expandBtn = container?.querySelector('button[title*="Minimize"], button[title*="Expand"]');
    const contentContainer = document.getElementById('hud-content-container');
    
    if (!container || !expandBtn || !contentContainer) return;
    
    const isCurrentlyCollapsed = expandBtn.textContent === '+';
    
    if (collapse && !isCurrentlyCollapsed) {
        expandBtn.click();
    } else if (!collapse && isCurrentlyCollapsed) {
        expandBtn.click();
    }
}
