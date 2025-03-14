// page3.js
import { PieChart } from "./pieChart.js";
export function initPage3() {
    const pageElement = document.querySelector('#page3');

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
            new PieChart("vis5", data);
        }).catch(function(err) {
            console.log("Error loading data:", err);
        });
    }


    initializeVisualizations();

    pageElement.addEventListener('click', () => {
        console.log('Clicked Plastic Waste Page');
    });
}
