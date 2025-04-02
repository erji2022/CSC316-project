// waterQualityVisPage.js

import { renderPHHeatmap } from "./pHHeatMap.js";
export function initWaterQualityVisPage() {
    const pageElement = document.querySelector('#waterQualityVisPage');

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
