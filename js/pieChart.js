export class PieChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.selectedRegion = "Total World";

        this.circleColors = {
            "Recycled": "#4CAF50",
            "Incinerated": "#FF9800",
            "Landfilled": "#795548",
            "Mismanaged": "#E91E63",
            "Littered": "#03A9F4"
        };

        this.minRadius = 80;
        this.maxRadius = 180;

        this.globalTotals = data.map(d =>
            +d.Recycled + +d.Incinerated + +d.Landfilled + +d.Mismanaged + +d.Littered
        );
        this.globalMin = d3.min(this.globalTotals);
        this.globalMax = d3.max(this.globalTotals);

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width = 400;
        vis.height = 400;

        let container = d3.select("#" + vis.parentElement)
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        let dropdownContainer = container.append("div")
            .style("margin-bottom", "10px");

        dropdownContainer.append("label")
            .attr("for", "regionDropdown")
            .text("Select a Region: ")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("margin-right", "10px");

        vis.dropdown = dropdownContainer.append("select")
            .attr("id", "regionDropdown")
            .on("change", function () {
                vis.selectedRegion = this.value;
                vis.wrangleData();
            });

        vis.svg = container.append("svg")
            .attr("viewBox", `0 0 ${vis.width} ${vis.height + 40}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("max-width", "400px")
            .append("g")
            .attr("transform", `translate(${vis.width / 2}, ${(vis.height / 2) + 10})`);

        vis.pie = d3.pie().value(d => d.value).sort((a, b) => b.value - a.value);
        vis.pieChartGroup = vis.svg.append("g");

        vis.totalLabel = container.append("div")
            .attr("class", "total-label")
            .style("margin-top", "10px")
            .style("font-size", "14px")
            .style("font-weight", "500");

        vis.legend = container.append("div")
            .attr("class", "legend")
            .style("display", "flex")
            .style("flex-wrap", "wrap")
            .style("justify-content", "center")
            .style("margin-top", "10px");

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

        vis.data.forEach(d => { d.Region = d.Region.trim(); });
        let regionData = vis.data.find(d => d.Region === vis.selectedRegion);
        if (!regionData) return;

        let wasteTypes = Object.keys(this.circleColors);

        let displayData = wasteTypes.map(type => ({
            type: type,
            value: +regionData[type]
        }));

        let totalWaste = d3.sum(displayData, d => d.value);
        vis.updateVis(displayData, totalWaste);
    }

    updateVis(data, totalWaste) {
        let vis = this;

        let scaledRadius = d3.scaleLinear()
            .domain([vis.globalMin, vis.globalMax])
            .range([vis.minRadius, vis.maxRadius])(totalWaste);

        vis.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(scaledRadius);

        let pieData = vis.pie(data);
        let arcs = vis.pieChartGroup.selectAll(".arc").data(pieData);

        arcs.exit().remove();

        arcs.enter()
            .append("path")
            .attr("class", "arc")
            .merge(arcs)
            .transition()
            .duration(750)
            .attrTween("d", function (d) {
                let interpolate = d3.interpolate(this._current || d, d);
                this._current = interpolate(0);
                return t => vis.arc(interpolate(t));
            })
            .attr("fill", d => vis.circleColors[d.data.type])
            .attr("stroke", "#fff")
            .style("stroke-width", "2px");

        vis.pieChartGroup.selectAll(".arc")
            .on("mouseover", function (event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7);
                let percent = ((d.data.value / totalWaste) * 100).toFixed(1);
                vis.tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.data.type}</strong><br>${percent}% of total waste`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", function (event) {
                vis.tooltip
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).transition().duration(200).attr("opacity", 1);
                vis.tooltip.style("opacity", 0);
            });

        vis.totalLabel.html(`<strong>Total Waste:</strong> ${totalWaste.toFixed(2)} million metric tons`);

        let regions = [...new Set(vis.data.map(d => d.Region))];
        vis.dropdown.selectAll("option")
            .data(regions)
            .join("option")
            .text(d => d)
            .attr("value", d => d)
            .property("selected", d => d === vis.selectedRegion);

        // Legend
        let legendItems = vis.legend.selectAll(".legend-item")
            .data(Object.entries(vis.circleColors));

        let enterItems = legendItems.enter().append("div").attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin", "4px 10px");

        enterItems.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("margin-right", "6px")
            .style("background-color", d => d[1]);

        enterItems.append("span")
            .text(d => d[0]);

        legendItems.exit().remove();
    }
}
