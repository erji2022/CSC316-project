// TemperatureSeaLevelChart.js
// This module creates a dual-axis chart with Temperature (bars) and Sea Level (line)
// For Sea Level, it loads two data files:
//   - Old file: "data/global-average-absolute-sea-level-change.csv"
//   - New file: "data/gmsl.txt"
// The new file’s sea-level values are normalized (via an offset) using overlapping years.

export function renderTempSeaLevelChart() {
    const container = d3.select("#vis2");
    const containerWidth = parseInt(container.style("width"));
    const containerHeight = 400;
    const margin = {top: 20, right: 60, bottom: 40, left: 50};
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Vertical line for hover effect
    const verticalLine = svg.append("line")
        .attr("class", "vertical-line")
        .style("opacity", 0);

    const parseTemp = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && /^\d/.test(line.trim()));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            const year = +cols[0];
            const lowess = +cols[2];
            return {year, temp: lowess};
        });
    };

    const loadAndCombineSeaLevelData = () => {
        return Promise.all([
            d3.csv("data/global-average-absolute-sea-level-change.csv"),
            d3.text("data/gmsl.txt")
        ]).then(([oldCsvData, newText]) => {
            const oldData = oldCsvData.map(d => ({
                year: +d.Time,
                gmsl: +d.GMSL
            }));

            const newLines = newText.split("\n")
                .filter(line => line.trim() !== "" && !line.startsWith("HDR"));
            const newData = newLines.map(line => {
                const cols = line.trim().split(/\s+/);
                const yearFraction = +cols[2];
                const year = Math.floor(yearFraction);
                const gmsl = +cols[11];
                return {year, gmsl};
            });

            const differences = [];
            newData.forEach(nd => {
                const oldRec = oldData.find(od => od.year === nd.year);
                if (oldRec) {
                    differences.push(oldRec.gmsl - nd.gmsl);
                }
            });
            const offset = d3.mean(differences) || 0;
            newData.forEach(nd => {
                nd.gmsl = nd.gmsl + offset;
            });

            const combinedMap = {};
            oldData.forEach(rec => {
                combinedMap[rec.year] = rec;
            });
            newData.forEach(rec => {
                if (!combinedMap[rec.year]) {
                    combinedMap[rec.year] = rec;
                }
            });
            const combinedData = Object.values(combinedMap).sort((a, b) => a.year - b.year);
            return combinedData;
        });
    };

    Promise.all([
        d3.text("data/land-ocean-temperature.txt"),
        loadAndCombineSeaLevelData()
    ])
        .then(([tempRaw, seaData]) => {
            const tempData = parseTemp(tempRaw);

            // Combine Temperature and Sea Level data based on matching years.
            const combinedChartData = [];
            tempData.forEach(t => {
                const seaRec = seaData.find(s => s.year === t.year);
                if (seaRec) {
                    combinedChartData.push({year: t.year, temp: t.temp, gmsl: seaRec.gmsl});
                }
            });
            combinedChartData.sort((a, b) => a.year - b.year);

            const x = d3.scaleBand()
                .domain(combinedChartData.map(d => d.year))
                .range([0, width])
                .padding(0.1);

            const yTemp = d3.scaleLinear()
                .domain([d3.min(combinedChartData, d => d.temp), d3.max(combinedChartData, d => d.temp)])
                .nice()
                .range([height, 0]);

            const ySea = d3.scaleLinear()
                .domain([d3.min(combinedChartData, d => d.gmsl), d3.max(combinedChartData, d => d.gmsl)])
                .nice()
                .range([height, 0]);

            // Helper function to update hover effects
            function updateHover(d, event) {
                // Show tooltip
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html("Year: " + d.year + "<br/>Temp: " + d.temp + "°C<br/>Sea Level: " + d.gmsl.toFixed(2) + " mm")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                // Draw vertical guideline at the center of the corresponding band
                verticalLine
                    .attr("x1", x(d.year) + x.bandwidth() / 2)
                    .attr("x2", x(d.year) + x.bandwidth() / 2)
                    .attr("y1", 0)
                    .attr("y2", height)
                    .style("stroke", "black")
                    .style("stroke-dasharray", "3,3")
                    .style("opacity", 1);

                // Reset all bars and circles to their original style
                svg.selectAll(".bar-temp")
                    .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
                svg.selectAll(".circle-sea")
                    .attr("r", 1);

                // Highlight the corresponding bar and circle
                svg.selectAll(".bar-temp")
                    .filter(d2 => d2.year === d.year)
                    .attr("fill", d => d.temp < 0 ? d3.rgb("steelblue").darker(0.7) : d3.rgb("tomato").darker(0.7));
                svg.selectAll(".circle-sea")
                    .filter(d2 => d2.year === d.year)
                    .attr("r", 3);
            }

            // Draw temperature bars with hover events.
            svg.selectAll(".bar-temp")
                .data(combinedChartData)
                .enter()
                .append("rect")
                .attr("class", "bar-temp")
                .attr("data-year", d => d.year)
                .attr("x", d => x(d.year))
                .attr("y", d => d.temp >= 0 ? yTemp(d.temp) : yTemp(0))
                .attr("width", x.bandwidth())
                .attr("height", d => Math.abs(yTemp(d.temp) - yTemp(0)))
                .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato")
                .on("mouseover", function (event, d) {
                    updateHover(d, event);
                })
                .on("mouseout", function (event, d) {
                    tooltip.transition().duration(500).style("opacity", 0);
                    verticalLine.style("opacity", 0);
                    d3.select(this).attr("fill", d.temp < 0 ? "steelblue" : "tomato");
                    svg.selectAll(".circle-sea")
                        .filter(d2 => d2.year === d.year)
                        .attr("r", 1);
                });

            // Draw a horizontal dashed line at temperature = 0 (baseline)
            svg.append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", yTemp(0))
                .attr("y2", yTemp(0))
                .attr("stroke", "black")
                .attr("stroke-dasharray", "4 2");

            const seaLine = d3.line()
                .x(d => x(d.year) + x.bandwidth() / 2)
                .y(d => ySea(d.gmsl));

            svg.append("path")
                .datum(combinedChartData)
                .attr("fill", "none")
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("d", seaLine);

            // Draw sea-level circles with initial radius 1 and hover events.
            svg.selectAll(".circle-sea")
                .data(combinedChartData)
                .enter()
                .append("circle")
                .attr("class", "circle-sea")
                .attr("data-year", d => d.year)
                .attr("cx", d => x(d.year) + x.bandwidth() / 2)
                .attr("cy", d => ySea(d.gmsl))
                .attr("r", 1) // initial radius is 1
                .attr("fill", "green")
                .on("mouseover", function (event, d) {
                    updateHover(d, event);
                })
                .on("mouseout", function (event, d) {
                    tooltip.transition().duration(500).style("opacity", 0);
                    verticalLine.style("opacity", 0);
                    d3.select(this).attr("r", 1);
                    svg.selectAll(".bar-temp")
                        .filter(d2 => d2.year === d.year)
                        .attr("fill", d.temp < 0 ? "steelblue" : "tomato");
                });

            // Add an overlay to capture hover events in the white space between elements.
            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mousemove", function (event) {
                    // Get the mouse x coordinate relative to the chart group.
                    const [mouseX] = d3.pointer(event);
                    // Find the nearest data point by comparing the center of each band.
                    let nearest = null;
                    let minDist = Infinity;
                    combinedChartData.forEach(d => {
                        const cx = x(d.year) + x.bandwidth() / 2;
                        const dist = Math.abs(mouseX - cx);
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = d;
                        }
                    });
                    if (nearest) {
                        updateHover(nearest, event);
                    }
                })
                .on("mouseout", function () {
                    tooltip.transition().duration(500).style("opacity", 0);
                    verticalLine.style("opacity", 0);
                    svg.selectAll(".bar-temp")
                        .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
                    svg.selectAll(".circle-sea")
                        .attr("r", 1);
                });

            const xAxis = d3.axisBottom(x)
                .tickValues(x.domain().filter((d, i) => !(i % 10)));
            svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(xAxis);
            svg.append("g")
                .call(d3.axisLeft(yTemp));
            svg.append("g")
                .attr("transform", `translate(${width}, 0)`)
                .call(d3.axisRight(ySea));

            svg.append("text")
                .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 5})`)
                .style("text-anchor", "middle")
                .text("Year");
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 18)
                .attr("x", -height / 2)
                .style("text-anchor", "middle")
                .text("Temperature (°C)");
            svg.append("text")
                .attr("transform", `translate(${width + 37}, ${height / 2}) rotate(90)`)
                .style("text-anchor", "middle")
                .text("Sea Level (mm)");
        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}
