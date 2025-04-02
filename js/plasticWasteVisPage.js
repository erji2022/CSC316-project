// plasticWasteVisPage.js
import { PlasticWasteChart } from "./plasticWasteChart.js";
export function initPlasticWasteVisPage() {
    const pageElement = document.querySelector('#plasticWasteVisPage');

    function initializeVisualizations() {
        d3.csv("data/waste.csv").then(function(data) {
            // Convert numerical fields from strings to numbers
            data.forEach(d => {
                d.Total = +d.Total;
                d.Recycled = +d.Recycled;
                d.Incinerated = +d.Incinerated;
                d.Landfilled = +d.Landfilled;
                d.Mismanaged = +d.Mismanaged;
                d.Littered = +d.Littered;
            });
    
            // Initialize Pie Chart inside 'vis5'
            new PlasticWasteChart("vis5", data);
        }).catch(function(err) {
            console.log("Error loading data:", err);
        });
    }


    initializeVisualizations();

    pageElement.addEventListener('click', () => {
        console.log('Clicked Plastic Waste Page');
    });
}
