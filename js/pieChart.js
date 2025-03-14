export class PieChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.selectedRegion = "Total World"; // Default selection

        // Vibrant colors for categories
        this.circleColors = {
            "Recycled": "#4CAF50",      // Green
            "Incinerated": "#FF9800",   // Orange
            "Landfilled": "#795548",    // Brown
            "Mismanaged": "#E91E63",    // Pinkish-Red
            "Littered": "#03A9F4"       // Blue
        };

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up dimensions
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width = 400;
        vis.height = 400;
        vis.radius = Math.min(vis.width, vis.height) / 2;

        // Create container div
        let container = d3.select("#" + vis.parentElement)
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        // Create a div for the dropdown with a label
        let dropdownContainer = container.append("div")
            .style("margin-bottom", "10px");

        dropdownContainer.append("label")
            .attr("for", "regionDropdown")
            .text("Select a Region: ")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("margin-right", "10px");

        // Append dropdown inside the container
        vis.dropdown = dropdownContainer.append("select")
            .attr("id", "regionDropdown")
            .on("change", function () {
                vis.selectedRegion = this.value;
                vis.wrangleData();
            });

        // Add SVG for pie chart
        vis.svg = container.append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`);

        // Define pie layout
        vis.pie = d3.pie().value(d => d.value);
        vis.arc = d3.arc().innerRadius(0).outerRadius(vis.radius);

        // Add group for pie slices
        vis.pieChartGroup = vis.svg.append("g");

        // Add tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.75)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .style("opacity", 0);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Ensure region names are trimmed
        vis.data.forEach(d => { d.Region = d.Region.trim(); });

        // Get selected region's data
        let regionData = vis.data.find(d => d.Region === vis.selectedRegion);

        // If region not found, log an error
        if (!regionData) {
            console.error(`Region "${vis.selectedRegion}" not found in dataset.`);
            return;
        }

        let wasteTypes = ["Recycled", "Incinerated", "Landfilled", "Mismanaged", "Littered"];

        let displayData = wasteTypes.map(type => ({
            type: type,
            value: +regionData[type] // Convert string to number
        }));

        vis.updateVis(displayData);
    }

    updateVis(data) {
        let vis = this;

        // Calculate total waste for percentage calculations
        let totalWaste = d3.sum(data, d => d.value);

        // Bind data to pie chart
        let pieData = vis.pie(data);
        let arcs = vis.pieChartGroup.selectAll(".arc").data(pieData);

        // Remove old arcs
        arcs.exit().remove();

        // Append new arcs and add tooltip functionality
        arcs.enter()
            .append("path")
            .attr("class", "arc")
            .merge(arcs)
            .transition()
            .duration(750)
            .attrTween("d", function (d) {
                let interpolate = d3.interpolate(this._current || d, d);
                this._current = interpolate(0);
                return function (t) { return vis.arc(interpolate(t)); };
            })
            .attr("fill", d => vis.circleColors[d.data.type])
            .attr("stroke", "#fff")
            .style("stroke-width", "2px");

        // Tooltip interactions
        vis.pieChartGroup.selectAll(".arc")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("opacity", 0.7);

                let percentage = ((d.data.value / totalWaste) * 100).toFixed(1); // FIXED

                vis.tooltip
                    .style("opacity", 1)
                    .html(`
                        <strong>${d.data.type}</strong><br>
                        ${percentage}% of total waste
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", function (event) {
                vis.tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("opacity", 1);

                vis.tooltip.style("opacity", 0);
            });

        // Update dropdown options dynamically
        let regions = [...new Set(vis.data.map(d => d.Region))];
        vis.dropdown.selectAll("option")
            .data(regions)
            .join("option")
            .text(d => d)
            .attr("value", d => d)
            .property("selected", d => d === vis.selectedRegion);
    }

}
