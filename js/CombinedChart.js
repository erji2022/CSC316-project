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
    const margin = {top: 20, right: 60, bottom: 40, left: 50};
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip.
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Vertical guideline for hover.
    const verticalLine = svg.append("line")
        .attr("class", "vertical-line")
        .style("opacity", 0);

    // ---------------------------
    // Parsing functions
    // ---------------------------
    // Parse temperature file (land-ocean-temperature.txt).
    const parseTemp = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && /^\d/.test(line.trim()));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            return {year: +cols[0], temp: +cols[2]};
        });
    };

    // Parse the CO₂ data from the mm-mlo file.
    const parseCO2_mlo = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && !line.startsWith("#"));
        // Each line: [year, ... , deseason, ...] – we assume the 1st token is year and 5th token is deseasonalized value.
        const monthlyData = lines.map(line => {
            const cols = line.trim().split(/\s+/);
            return {year: +cols[0], co2: +cols[4]};
        });
        // Aggregate monthly values to yearly average.
        const co2ByYear = d3.rollups(monthlyData,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));
        return co2ByYear;
    };

    // Parse the CO₂ data from the co2-1850.txt file.
    // This file is arranged in a multi‐column (free‐format) style.
    // We “scan” for tokens that are a valid year (1880–1954) and then take the next token as the mixing ratio.
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
        // In case of duplicate years, average them.
        const co2ByYear = d3.rollups(data,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));
        return co2ByYear;
    };

    // Load and combine sea level data (from chart two).
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
            // Determine offset using overlapping years.
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
            // Merge the two datasets.
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
            // Parse temperature data.
            const tempData = parseTemp(tempRaw);

            // Parse CO₂ from the two files.
            const co2_mloData = parseCO2_mlo(co2MloRaw);
            const co2_1850Data = parseCO2_1850(co2_1850Raw);

            // Merge CO₂ data and restrict to years ≥ 1880.
            let co2Data = co2_1850Data.concat(co2_mloData)
                .filter(d => d.year >= 1880);
            // In case of duplicate years, average them.
            co2Data = d3.rollups(co2Data, v => d3.mean(v, d => d.co2), d => d.year)
                .map(([year, avgCO2]) => ({year, co2: avgCO2}));

            // Combine all three datasets by year.
            // We include only years that have temperature, CO₂, and sea level data.
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

            // Temperature y-scale (left axis).
            const yTemp = d3.scaleLinear()
                .domain(d3.extent(combinedData, d => d.temp)).nice()
                .range([height, 0]);

            // Right-axis scale will show CO₂ (in ppm).
            const yCO2 = d3.scaleLinear()
                .domain(d3.extent(combinedData, d => d.co2)).nice()
                .range([height, 0]);

            // For sea level we create a transform so that its values map onto the CO₂ scale.
            const seaExtent = d3.extent(combinedData, d => d.gmsl);
            const ySeaTransform = d3.scaleLinear()
                .domain(seaExtent)
                // Map sea level so that its max (largest value) aligns with the top of the CO₂ scale
                // and its min aligns with the bottom.
                .range([yCO2(yCO2.domain()[0]), yCO2(yCO2.domain()[1])]);

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
                    updateHover(d, event);
                })
                .on("mouseout", function (event, d) {
                    tooltip.transition().duration(500).style("opacity", 0);
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

            // ---------------------------
            // Hover update function.
            // ---------------------------
            function updateHover(d, event) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(
                    "Year: " + d.year +
                    "<br/>Temp: " + d.temp + "°C" +
                    "<br/>CO₂: " + d.co2.toFixed(2) + " ppm" +
                    "<br/>Sea Level: " + d.gmsl.toFixed(2) + " mm"
                )
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                verticalLine
                    .attr("x1", x(d.year) + x.bandwidth() / 2)
                    .attr("x2", x(d.year) + x.bandwidth() / 2)
                    .attr("y1", -15)
                    .attr("y2", height)
                    .style("stroke", "black")
                    .style("stroke-dasharray", "3,3")
                    .style("opacity", 1);

                // Reset all elements.
                svg.selectAll(".bar-temp")
                    .attr("fill", dBar => dBar.temp < 0 ? "steelblue" : "tomato");
                svg.selectAll(".circle-co2")
                    .attr("r", 1);
                svg.selectAll(".circle-sea")
                    .attr("r", 1);

                // Highlight the current elements.
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
                    if (nearest) updateHover(nearest, event);
                })
                .on("mouseout", function () {
                    tooltip.transition().duration(500).style("opacity", 0);
                    verticalLine.style("opacity", 0);
                    svg.selectAll(".bar-temp")
                        .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
                    svg.selectAll(".circle-co2").attr("r", 1);
                    svg.selectAll(".circle-sea").attr("r", 1);
                });

            // ---------------------------
            // Add Axes.
            // ---------------------------
            // X-Axis.
            const xAxis = d3.axisBottom(x)
                .tickValues(x.domain().filter((d, i) => !(i % 5)));
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis);

            // Left Y-Axis for Temperature.
            svg.append("g")
                .call(d3.axisLeft(yTemp));

            // Right Y-Axis for CO₂.
            svg.append("g")
                .attr("transform", `translate(${width},0)`)
                .call(d3.axisRight(yCO2))
                .append("text")
                .attr("transform", "rotate(90)")
                .attr("x", height / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .style("text-anchor", "middle")
                .text("CO₂ (ppm)");

            // Horizontal baseline for Temperature.
            svg.append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", yTemp(0))
                .attr("y2", yTemp(0))
                .attr("stroke", "black")
                .attr("stroke-dasharray", "4 2");

            // X-Axis label.
            svg.append("text")
                .attr("transform", `translate(${width / 2},${height + margin.bottom - 5})`)
                .style("text-anchor", "middle")
                .text("Year");

            // Left Y-Axis label.
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -margin.left + 18)
                .attr("x", -height / 2)
                .style("text-anchor", "middle")
                .text("Temperature (°C)");

            // ---------------------------
            // Add Legend.
            // ---------------------------
            // Place the legend in the upper-right corner (inside the SVG).
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 150},20)`);

            // Temperature (bars).
            legend.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", "tomato");
            legend.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .text("Temperature (°C)");

            // CO₂ (line).
            legend.append("line")
                .attr("x1", 0)
                .attr("y1", 20)
                .attr("x2", 10)
                .attr("y2", 20)
                .attr("stroke", "green")
                .attr("stroke-width", 2);
            legend.append("text")
                .attr("x", 15)
                .attr("y", 24)
                .text("CO₂ (ppm)");

            // Sea Level (line; note the values are scaled for plotting).
            legend.append("line")
                .attr("x1", 0)
                .attr("y1", 40)
                .attr("x2", 10)
                .attr("y2", 40)
                .attr("stroke", "blue")
                .attr("stroke-width", 2);
            legend.append("text")
                .attr("x", 15)
                .attr("y", 44)
                .text("Sea Level (mm)*");

            legend.append("text")
                .attr("x", 0)
                .attr("y", 60)
                .attr("font-size", "10px")
                .text("* Raw values shown in tooltip");

        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}
