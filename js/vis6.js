// vis6.js
// This module creates a dual-axis chart with Temperature (bars) and Sea Level (line)
// For Sea Level, it loads two data files:
//   - Old file: "data/global-average-absolute-sea-level-change.csv"
//   - New file: "data/gmsl.txt"
// The new file’s sea-level values are normalized (via an offset) using overlapping years.

export function renderTempSeaLevelChart() {
    const container = d3.select("#vis6");
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
            // Old sea level file (CSV)
            d3.csv("data/global-average-absolute-sea-level-change.csv"),
            // New sea level file (TXT)
            d3.text("data/gmsl.txt")
        ]).then(([oldCsvData, newText]) => {
            // Parse old CSV file.
            const oldData = oldCsvData.map(d => ({
                year: +d.Time,
                gmsl: +d.GMSL
            }));

            // Parse new file.
            const newLines = newText.split("\n")
                .filter(line => line.trim() !== "" && !line.startsWith("HDR"));
            const newData = newLines.map(line => {
                const cols = line.trim().split(/\s+/);
                // Column 3 (index 2) is year+fraction; take Math.floor for integer year.
                const yearFraction = +cols[2];
                const year = Math.floor(yearFraction);
                // Column 12 (index 11) is the smoothed (GIA applied) GMSL variation in mm.
                const gmsl = +cols[11];
                return {year, gmsl};
            });

            // Compute offset between the two datasets over overlapping years.
            const differences = [];
            newData.forEach(nd => {
                const oldRec = oldData.find(od => od.year === nd.year);
                if (oldRec) {
                    differences.push(oldRec.gmsl - nd.gmsl);
                }
            });
            const offset = d3.mean(differences) || 0;
            // Adjust newData values by adding the offset.
            newData.forEach(nd => {
                nd.gmsl = nd.gmsl + offset;
            });

            // Combine the two datasets.
            // Use a mapping keyed by year; prefer the old data when available.
            const combinedMap = {};
            oldData.forEach(rec => {
                combinedMap[rec.year] = rec;
            });
            newData.forEach(rec => {
                if (!combinedMap[rec.year]) {
                    combinedMap[rec.year] = rec;
                }
            });
            // Convert map to sorted array.
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

            svg.selectAll(".bar-temp")
                .data(combinedChartData)
                .enter()
                .append("rect")
                .attr("class", "bar-temp")
                .attr("x", d => x(d.year))
                .attr("y", d => d.temp >= 0 ? yTemp(d.temp) : yTemp(0))
                .attr("width", x.bandwidth())
                .attr("height", d => Math.abs(yTemp(d.temp) - yTemp(0)))
                .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");

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

            const xAxis = d3.axisBottom(x)
                .tickValues(x.domain().filter((d, i) => !(i % 5)));
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
