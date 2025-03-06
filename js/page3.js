import {renderTempCO2Chart} from "./vis5.js";
import {renderTempSeaLevelChart} from "./vis6.js";

export function initPage3() {
    const pageElement = document.querySelector('[id="page3"]');
    initializeVisualizations();

    function initializeVisualizations() {
        // Your vis5 and vis6 initialization code
        renderTempCO2Chart();
        renderTempSeaLevelChart()
    }

    pageElement.addEventListener('click', handlePageClick);

    function handlePageClick() {
        console.log('Clicked page 3');
    }
}