// TemperatureCO2Chart.js
// This module creates the combined Temperature (bars) and CO₂ (line) chart in #vis5

export function renderTempCO2Chart() {
    const container = d3.select("#vis1");

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

    // Create tooltip element.
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Create vertical line for hover effect.
    const verticalLine = svg.append("line")
        .attr("class", "vertical-line")
        .style("opacity", 0);

    // Parse CO₂ data: year and deseasonalized monthly average.
    const parseCO2 = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && !line.startsWith("#"));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            const year = +cols[0];
            const deseason = +cols[4];
            return {year, co2: deseason};
        });
    };

    // Parse Temperature data: year and Lowess(5)
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

    // Load both data files.
    Promise.all([
        d3.text("data/co2-mm-mlo.txt"),
        d3.text("data/land-ocean-temperature.txt")
    ]).then(([co2Raw, tempRaw]) => {
        const co2Data = parseCO2(co2Raw);
        const tempData = parseTemp(tempRaw);

        // Aggregate monthly CO₂ data into yearly averages.
        const co2ByYear = d3.rollups(co2Data,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));

        // Combine datasets by matching year.
        const combinedData = [];
        tempData.forEach(t => {
            const co2Obj = co2ByYear.find(c => c.year === t.year);
            if (co2Obj) {
                combinedData.push({year: t.year, temp: t.temp, co2: co2Obj.co2});
            }
        });
        combinedData.sort((a, b) => a.year - b.year);

        // X-scale: discrete years.
        const x = d3.scaleBand()
            .domain(combinedData.map(d => d.year))
            .range([0, width])
            .padding(0.1);

        // Y-scale for Temperature (bars).
        const yTemp = d3.scaleLinear()
            .domain([d3.min(combinedData, d => d.temp), d3.max(combinedData, d => d.temp)])
            .nice()
            .range([height, 0]);

        // Y-scale for CO₂ (line).
        const yCO2 = d3.scaleLinear()
            .domain([d3.min(combinedData, d => d.co2), d3.max(combinedData, d => d.co2)])
            .nice()
            .range([height, 0]);

        // Draw Temperature bars.
        svg.selectAll(".bar")
            .data(combinedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
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
            });

        // Draw CO₂ line.
        const co2Line = d3.line()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y(d => yCO2(d.co2));

        svg.append("path")
            .datum(combinedData)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 2)
            .attr("d", co2Line);

        // Draw CO₂ circles along the line with an initial radius of 1.
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
                svg.selectAll(".bar")
                    .filter(d2 => d2.year === d.year)
                    .attr("fill", d.temp < 0 ? "steelblue" : "tomato");
            });

        // Helper function to update hover effects.
        function updateHover(d, event) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html("Year: " + d.year + "<br/>Temp: " + d.temp + "°C<br/>CO₂: " + d.co2.toFixed(2) + " ppm")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");

            verticalLine
                .attr("x1", x(d.year) + x.bandwidth() / 2)
                .attr("x2", x(d.year) + x.bandwidth() / 2)
                .attr("y1", 0)
                .attr("y2", height)
                .style("stroke", "black")
                .style("stroke-dasharray", "3,3")
                .style("opacity", 1);

            // Reset all bars and circles to default.
            svg.selectAll(".bar")
                .attr("fill", dBar => dBar.temp < 0 ? "steelblue" : "tomato");
            svg.selectAll(".circle-co2")
                .attr("r", 1);

            // Highlight the corresponding bar and circle.
            svg.selectAll(".bar")
                .filter(dBar => dBar.year === d.year)
                .attr("fill", dBar => dBar.temp < 0 ? d3.rgb("steelblue").darker(0.7) : d3.rgb("tomato").darker(0.7));
            svg.selectAll(".circle-co2")
                .filter(dBar => dBar.year === d.year)
                .attr("r", 3);
        }

        // Add an overlay to capture hover events in the white space between elements.
        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mousemove", function (event) {
                // Get the mouse x coordinate relative to the chart.
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
                if (nearest) {
                    updateHover(nearest, event);
                }
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
                verticalLine.style("opacity", 0);
                svg.selectAll(".bar")
                    .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
                svg.selectAll(".circle-co2")
                    .attr("r", 1);
            });

        // Create X-axis (with ticks for every 5th year).
        const xAxis = d3.axisBottom(x)
            .tickValues(x.domain().filter((d, i) => !(i % 5)));

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);

        // Create left Y-axis for Temperature.
        svg.append("g")
            .call(d3.axisLeft(yTemp));

        // Create right Y-axis for CO₂.
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yCO2));

        // Draw a horizontal dashed line at temperature = 0 (baseline).
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", yTemp(0))
            .attr("y2", yTemp(0))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4 2");

        // X-axis label.
        svg.append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 5})`)
            .style("text-anchor", "middle")
            .text("Year");

        // Left Y-axis label.
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 18)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .text("Temperature (°C)");

        // Right Y-axis label.
        svg.append("text")
            .attr("transform", `translate(${width + 37}, ${height / 2}) rotate(90)`)
            .style("text-anchor", "middle")
            .text("CO₂ (ppm)");
    })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}
