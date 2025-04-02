// airQualityVisPage.js
import { initAirQualityTrends } from "./airQualityChart.js";

export function initAirQualityVisPage() {
    const pageElement = document.querySelector('#airQualityVisPage');
    function initializeVisualizations() {
        initAirQualityTrends();
    }

    initializeVisualizations();

    pageElement.addEventListener('click', () => {
        console.log('Clicked Air Quality Page');
    });
}
