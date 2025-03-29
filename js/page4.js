// page4.js

import { renderPHHeatmap } from "./pH.js";
export function initPage4() {
    const pageElement = document.querySelector('#page4');

    function initializeVisualizations() {
        // Heatmap for Water Quality (pH Levels)
        renderPHHeatmap();
    }

    initializeVisualizations();

    document.getElementById("yearRange").addEventListener("change", () => {
        renderPHHeatmap();
    });
    
    pageElement.addEventListener('click', () => {
        console.log('Clicked Water Quality Page');
    });
}
