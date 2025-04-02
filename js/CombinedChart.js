// CombinedChart.js
// This module creates a single chart that shows:
// - Temperature (bars, left y-axis)
// - CO₂ (line + circles, right y-axis in ppm)
// - Sea Level (line + circles, scaled to the CO₂ axis; raw values in tooltips)
// A legend is added inside the SVG to explain the three series.

export function renderCombinedChart() {
    // Set up container and dimensions.
    const container = d3.select("#visCombined");
    const containerWidth = parseInt(container.style("width"));
    const containerHeight = parseInt(container.style("height"));
    const margin = {top: 20, right: 85, bottom: 40, left: 50};
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create an SVG tooltip group.
    const svgTooltip = svg.append("g")
        .attr("class", "svg-tooltip")
        .style("display", "none");

    // Append a background rectangle for the tooltip.
    svgTooltip.append("rect")
        .attr("class", "tooltip-bg")
        .attr("width", 175)
        .attr("height", 87)
        .attr("fill", "transparent")
        .attr("stroke", "#ccc")
        .attr("rx", 4)
        .attr("ry", 4);

    // Append a text element; we'll use tspans for multiple lines.
    const tooltipText = svgTooltip.append("text")
        .attr("class", "tooltip-text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("fill", "#000");

    // Vertical guideline for hover.
    const verticalLine = svg.append("line")
        .attr("class", "vertical-line")
        .style("opacity", 0);

    // ---------------------------
    // Parsing functions
    // ---------------------------
    const parseTemp = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && /^\d/.test(line.trim()));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            return {year: +cols[0], temp: +cols[2]};
        });
    };

    const parseCO2_mlo = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && !line.startsWith("#"));
        const monthlyData = lines.map(line => {
            const cols = line.trim().split(/\s+/);
            return {year: +cols[0], co2: +cols[4]};
        });
        const co2ByYear = d3.rollups(monthlyData,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));
        return co2ByYear;
    };

    const parseCO2_1850 = (raw) => {
        const tokens = raw.split(/\s+/);
        const data = [];
        for (let i = 0; i < tokens.length - 1; i++) {
            const year = +tokens[i];
            if (!isNaN(year) && year >= 1880 && year <= 1954) {
                const co2Val = +tokens[i + 1];
                if (!isNaN(co2Val)) {
                    data.push({year, co2: co2Val});
                }
            }
        }
        const co2ByYear = d3.rollups(data,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));
        return co2ByYear;
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

    // ---------------------------
    // Load all data files concurrently.
    // ---------------------------
    Promise.all([
        d3.text("data/land-ocean-temperature.txt"),
        d3.text("data/co2-mm-mlo.txt"),
        d3.text("data/co2-1850.txt"),
        loadAndCombineSeaLevelData()
    ])
        .then(([tempRaw, co2MloRaw, co2_1850Raw, seaData]) => {
            const tempData = parseTemp(tempRaw);
            const co2_mloData = parseCO2_mlo(co2MloRaw);
            const co2_1850Data = parseCO2_1850(co2_1850Raw);

            let co2Data = co2_1850Data.concat(co2_mloData)
                .filter(d => d.year >= 1880);
            co2Data = d3.rollups(co2Data, v => d3.mean(v, d => d.co2), d => d.year)
                .map(([year, avgCO2]) => ({year, co2: avgCO2}));

            // Combine datasets (only years with all data are included).
            const combinedData = [];
            tempData.forEach(t => {
                const co2Rec = co2Data.find(c => c.year === t.year);
                const seaRec = seaData.find(s => s.year === t.year);
                if (co2Rec && seaRec) {
                    combinedData.push({
                        year: t.year,
                        temp: t.temp,
                        co2: co2Rec.co2,
                        gmsl: seaRec.gmsl
                    });
                }
            });
            combinedData.sort((a, b) => a.year - b.year);

            // ---------------------------
            // Set up scales.
            // ---------------------------
            const x = d3.scaleBand()
                .domain(combinedData.map(d => d.year))
                .range([0, width])
                .padding(0.1);

            const yTemp = d3.scaleLinear()
                .domain(d3.extent(combinedData, d => d.temp)).nice()
                .range([height, 0]);

            const yCO2 = d3.scaleLinear()
                .domain(d3.extent(combinedData, d => d.co2)).nice()
                .range([height, 0]);

            const seaExtent = d3.extent(combinedData, d => d.gmsl);
            const ySeaTransform = d3.scaleLinear()
                .domain(seaExtent)
                .range([yCO2(yCO2.domain()[0]), yCO2(yCO2.domain()[1])]);

            // ---------------------------
            // Function to update the SVG tooltip.
            // ---------------------------
            function updateSvgTooltip(d, event) {
                // Update tooltip text using tspans for multiple lines.
                tooltipText.html(""); // clear existing text
                tooltipText.append("tspan")
                    .text(`Year: ${d.year}`)
                    .attr("x", 10)
                    .attr("dy", "0em");
                tooltipText.append("tspan")
                    .text(`Temp: ${d.temp}°C`)
                    .attr("x", 10)
                    .attr("dy", "1.2em");
                tooltipText.append("tspan")
                    .text(`CO₂: ${d.co2.toFixed(2)} ppm`)
                    .attr("x", 10)
                    .attr("dy", "1.2em");
                tooltipText.append("tspan")
                    .text(`Sea Level: ${d.gmsl.toFixed(2)} mm`)
                    .attr("x", 10)
                    .attr("dy", "1.2em");

                // Position the tooltip near the mouse pointer.
                const [mouseX, mouseY] = d3.pointer(event);
                const tooltipWidth = 175; // tooltip width defined on the rect
                let tooltipX = mouseX + 10; // default: position tooltip to the right of the mouse
                // If tooltip would overflow to the right, position it to the left.
                if (mouseX + 10 + tooltipWidth > width) {
                    tooltipX = mouseX - 10 - tooltipWidth;
                }
                svgTooltip.attr("transform", `translate(${tooltipX},${mouseY - 30})`);

                svgTooltip.raise();
                // Display the tooltip.
                svgTooltip.style("display", null);

                // Update vertical guideline.
                verticalLine
                    .attr("x1", x(d.year) + x.bandwidth() / 2)
                    .attr("x2", x(d.year) + x.bandwidth() / 2)
                    .attr("y1", -15)
                    .attr("y2", height)
                    .style("stroke", "black")
                    .style("stroke-dasharray", "3,3")
                    .style("opacity", 1);

                // Reset styling for all elements.
                svg.selectAll(".bar-temp")
                    .attr("fill", dBar => dBar.temp < 0 ? "steelblue" : "tomato");
                svg.selectAll(".circle-co2").attr("r", 1);
                svg.selectAll(".circle-sea").attr("r", 1);

                // Highlight current elements.
                svg.selectAll(".bar-temp")
                    .filter(dBar => dBar.year === d.year)
                    .attr("fill", d.temp < 0 ? d3.rgb("steelblue").darker(0.7) : d3.rgb("tomato").darker(0.7));
                svg.selectAll(".circle-co2")
                    .filter(dBar => dBar.year === d.year)
                    .attr("r", 3);
                svg.selectAll(".circle-sea")
                    .filter(dBar => dBar.year === d.year)
                    .attr("r", 3);
            }

            // ---------------------------
            // Draw Temperature Bars.
            // ---------------------------
            svg.selectAll(".bar-temp")
                .data(combinedData)
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
                    updateSvgTooltip(d, event);
                })
                .on("mouseout", function (event, d) {
                    svgTooltip.style("display", "none");
                    verticalLine.style("opacity", 0);
                    d3.select(this).attr("fill", d.temp < 0 ? "steelblue" : "tomato");
                    svg.selectAll(".circle-co2")
                        .filter(d2 => d2.year === d.year)
                        .attr("r", 1);
                    svg.selectAll(".circle-sea")
                        .filter(d2 => d2.year === d.year)
                        .attr("r", 1);
                });

            // ---------------------------
            // Draw CO₂ line and circles.
            // ---------------------------
            const co2Line = d3.line()
                .x(d => x(d.year) + x.bandwidth() / 2)
                .y(d => yCO2(d.co2));
            svg.append("path")
                .datum(combinedData)
                .attr("fill", "none")
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("d", co2Line);
            svg.selectAll(".circle-co2")
                .data(combinedData)
                .enter()
                .append("circle")
                .attr("class", "circle-co2")
                .attr("data-year", d => d.year)
                .attr("cx", d => x(d.year) + x.bandwidth() / 2)
                .attr("cy", d => yCO2(d.co2))
                .attr("r", 1)
                .attr("fill", "green")
                .on("mouseover", function (event, d) {
                    updateSvgTooltip(d, event);
                })
                .on("mouseout", function (event, d) {
                    svgTooltip.style("display", "none");
                    verticalLine.style("opacity", 0);
                    d3.select(this).attr("r", 1);
                    svg.selectAll(".bar-temp")
                        .filter(d2 => d2.year === d.year)
                        .attr("fill", d.temp < 0 ? "steelblue" : "tomato");
                });

            // ---------------------------
            // Draw Sea Level line and circles.
            // ---------------------------
            const seaLine = d3.line()
                .x(d => x(d.year) + x.bandwidth() / 2)
                .y(d => ySeaTransform(d.gmsl));
            svg.append("path")
                .datum(combinedData)
                .attr("fill", "none")
                .attr("stroke", "blue")
                .attr("stroke-width", 2)
                .attr("d", seaLine);
            svg.selectAll(".circle-sea")
                .data(combinedData)
                .enter()
                .append("circle")
                .attr("class", "circle-sea")
                .attr("data-year", d => d.year)
                .attr("cx", d => x(d.year) + x.bandwidth() / 2)
                .attr("cy", d => ySeaTransform(d.gmsl))
                .attr("r", 1)
                .attr("fill", "blue")
                .on("mouseover", function (event, d) {
                    updateSvgTooltip(d, event);
                })
                .on("mouseout", function (event, d) {
                    svgTooltip.style("display", "none");
                    verticalLine.style("opacity", 0);
                    d3.select(this).attr("r", 1);
                    svg.selectAll(".bar-temp")
                        .filter(d2 => d2.year === d.year)
                        .attr("fill", d.temp < 0 ? "steelblue" : "tomato");
                });

            // ---------------------------
            // Add an overlay to capture hover events.
            // ---------------------------
            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mousemove", function (event) {
                    const [mouseX] = d3.pointer(event);
                    let nearest = null;
                    let minDist = Infinity;
                    combinedData.forEach(d => {
                        const cx = x(d.year) + x.bandwidth() / 2;
                        const dist = Math.abs(mouseX - cx);
                        if (dist < minDist) {
                            minDist = dist;
                            nearest = d;
                        }
                    });
                    if (nearest) updateSvgTooltip(nearest, event);
                })
                .on("mouseout", function () {
                    svgTooltip.style("display", "none");
                    verticalLine.style("opacity", 0);
                    svg.selectAll(".bar-temp")
                        .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
                    svg.selectAll(".circle-co2").attr("r", 1);
                    svg.selectAll(".circle-sea").attr("r", 1);
                });

            // ---------------------------
            // Add Axes.
            // ---------------------------
            const xAxis = d3.axisBottom(x)
                .tickValues(x.domain().filter((d, i) => !(i % 5)));
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis);

            svg.append("g")
                .call(d3.axisLeft(yTemp));

            const numTicks = 10;
            const combinedAxis = d3.axisRight(yCO2)
                .ticks(numTicks)
                .tickFormat(d => {
                    const pixelPos = yCO2(d);
                    const seaLevelValue = ySeaTransform.invert(pixelPos);
                    return `${d} / ${Math.round(seaLevelValue)}`;
                });

            svg.append("g")
                .attr("transform", `translate(${width},0)`)
                .call(combinedAxis)

            svg.append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", yTemp(0))
                .attr("y2", yTemp(0))
                .attr("stroke", "black")
                .attr("stroke-dasharray", "4 2");

            svg.append("text")
                .attr("transform", `translate(${width / 2},${height + margin.bottom - 5})`)
                .style("text-anchor", "middle")
                .text("Year");

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 18)
                .attr("x", -height / 2)
                .style("text-anchor", "middle")
                .text("Temperature (°C)");

            svg.append("text")
                .attr("transform", "rotate(90)")
                .attr("y", -width - margin.right + 23)
                .attr("x", height / 2)
                .style("text-anchor", "middle")
                .text("CO₂ (ppm) / Sea Level (mm)");

            // ---------------------------
            // Add Legend.
            // ---------------------------
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 150},20)`);

            const a = 0, y = 337, w = 10, h = 10;

            legend.append("polygon")
                .attr("points", `${a},${y} ${a + w},${y} ${a},${y + h}`)
                .attr("fill", "orange");

            legend.append("polygon")
                .attr("points", `${a + w},${y} ${a + w},${y + h} ${a},${y + h}`)
                .attr("fill", "steelblue");

            legend.append("text")
                .attr("x", 15)
                .attr("y", 347)
                .text("Temperature (°C)");

            legend.append("line")
                .attr("x1", 0)
                .attr("y1", 365)
                .attr("x2", 10)
                .attr("y2", 365)
                .attr("stroke", "green")
                .attr("stroke-width", 2);
            legend.append("text")
                .attr("x", 15)
                .attr("y", 369)
                .text("CO₂ (ppm)");

            legend.append("line")
                .attr("x1", 0)
                .attr("y1", 385)
                .attr("x2", 10)
                .attr("y2", 385)
                .attr("stroke", "blue")
                .attr("stroke-width", 2);
            legend.append("text")
                .attr("x", 15)
                .attr("y", 389)
                .text("Sea Level (mm)*");

        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}
