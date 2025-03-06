import {renderClimateChart} from "./vis5.js";

export function initPage3() {
    const pageElement = document.querySelector('[id="page3"]');
    initializeVisualizations();

    function initializeVisualizations() {
        // Your vis5 and vis6 initialization code
        // d3.select('#vis5').html('Vis 5 Initialized');
        renderClimateChart();
        d3.select('#vis6').html('Vis 6 Initialized');
    }

    pageElement.addEventListener('click', handlePageClick);

    function handlePageClick() {
        console.log('Clicked page 3');
    }
}