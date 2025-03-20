// page2.js
import { initAirQualityTrends } from "./airQualityChart.js";

export function initPage2() {
    const pageElement = document.querySelector('#page2');
    function initializeVisualizations() {
        initAirQualityTrends();
    }

    initializeVisualizations();

    pageElement.addEventListener('click', () => {
        console.log('Clicked Air Quality Page');
    });
}
