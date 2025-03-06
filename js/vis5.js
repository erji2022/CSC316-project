// vis5.js
// This module creates the combined Temperature (bars) and CO₂ (line) chart in #vis5

export function renderTempCO2Chart() {
    const container = d3.select("#vis5");

    const containerWidth = parseInt(container.style("width")) || 700;
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

    // Parse CO₂ data from file: year and deseasonalized monthly average.
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

    // Parse Temperature data from file: year and Lowess(5)
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

    // Load both files from the "data/" folder
    Promise.all([
        d3.text("data/co2-mm-mlo.txt"),
        d3.text("data/land-ocean-temperature.txt")
    ]).then(([co2Raw, tempRaw]) => {
        const co2Data = parseCO2(co2Raw);
        const tempData = parseTemp(tempRaw);

        // Aggregate monthly CO₂ data into yearly averages
        const co2ByYear = d3.rollups(co2Data,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));

        // Combine datasets by matching year
        const combinedData = [];
        tempData.forEach(t => {
            const co2Obj = co2ByYear.find(c => c.year === t.year);
            if (co2Obj) {
                combinedData.push({year: t.year, temp: t.temp, co2: co2Obj.co2});
            }
        });
        combinedData.sort((a, b) => a.year - b.year);

        // X-scale: discrete years
        const x = d3.scaleBand()
            .domain(combinedData.map(d => d.year))
            .range([0, width])
            .padding(0.1);

        // Y-scale for Temperature (bars)
        const yTemp = d3.scaleLinear()
            .domain([d3.min(combinedData, d => d.temp), d3.max(combinedData, d => d.temp)])
            .nice()
            .range([height, 0]);

        // Y-scale for CO₂ (line)
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
            .attr("x", d => x(d.year))
            .attr("y", d => d.temp >= 0 ? yTemp(d.temp) : yTemp(0))
            .attr("width", x.bandwidth())
            .attr("height", d => Math.abs(yTemp(d.temp) - yTemp(0)))
            .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");

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

        // Create X-axis (with ticks for every 5th year)
        const xAxis = d3.axisBottom(x)
            .tickValues(x.domain().filter((d, i) => !(i % 5)));

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);

        // Create left Y-axis for Temperature
        svg.append("g")
            .call(d3.axisLeft(yTemp));

        // Create right Y-axis for CO₂
        svg.append("g")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yCO2));

        // Draw a horizontal dashed line at temperature = 0 (baseline)
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
