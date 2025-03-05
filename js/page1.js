export function initPage1() {
    const pageElement = document.querySelector('[id="page1"]');
    initializeVisualizations();

    function initializeVisualizations() {
        // Your vis1 and vis2 initialization code
        d3.select('#vis1').html('Vis 1 Initialized');
        d3.select('#vis2').html('Vis 2 Initialized');
    }

    pageElement.addEventListener('click', handlePageClick);

    function handlePageClick() {
        console.log('Clicked page 1');
    }
}