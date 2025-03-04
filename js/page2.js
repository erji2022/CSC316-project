export function initPage2() {
    const pageElement = document.querySelector('[id="page2"]');
    initializeVisualizations();

    function initializeVisualizations() {
        // Your vis3 and vis4 initialization code
        d3.select('#vis3').html('Vis 3 Initialized');
        d3.select('#vis4').html('Vis 4 Initialized');
    }

    pageElement.addEventListener('click', handlePageClick);

    function handlePageClick() {
        console.log('Clicked page 2');
    }
}