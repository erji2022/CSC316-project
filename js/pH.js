export function renderPHHeatmap() {
    const margin = { top: 30, right: 150, bottom: 50, left: 120 },
        containerWidth = document.querySelector("#vis6").clientWidth,
        width = containerWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    d3.select("#vis6").select("svg").remove(); // Clear previous visualization

    const svg = d3.select("#vis6")
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/pH.csv").then(data => {
        console.log("📥 Loaded Data:", data.length, "rows");

    
        data.forEach(d => {
            d["Station"] = d["GEMS Station Number"].trim();
            d["Station Group"] = d["Station"].slice(0, 1);
            d["Year"] = d["Sample Date"].trim().slice(0, 4);
            d["pH Value"] = parseFloat(d["Value"].trim());
        });

        data = data.filter(d => !isNaN(d["pH Value"])); // Remove invalid data

        //  Select **10 evenly spaced years**
        const allYears = [...new Set(data.map(d => d.Year))].sort();
        const step = Math.floor(allYears.length / 10);
        const selectedYears = allYears.filter((_, i) => i % step === 0).slice(0, 10);
        console.log("📅 Selected Years:", selectedYears);

        // Select **10 unique station groups**
        const allStationGroups = [...new Set(data.map(d => d["Station Group"]))].sort();
        const selectedStationGroups = allStationGroups.slice(0, 10);
        console.log("🏢 Selected Station Groups:", selectedStationGroups);

        //  Manually calculate average pH for each (Year, Station Group) pair
        let stationYearMap = {};

        data.forEach(d => {
            if (selectedYears.includes(d.Year) && selectedStationGroups.includes(d["Station Group"])) {
                let key = `${d.Year}-${d["Station Group"]}`;
                if (!stationYearMap[key]) {
                    stationYearMap[key] = { sum: 0, count: 0 };
                }
                stationYearMap[key].sum += d["pH Value"];
                stationYearMap[key].count += 1;
            }
        });

        let averagedData = [];
        selectedYears.forEach(year => {
            selectedStationGroups.forEach(stationGroup => {
                let key = `${year}-${stationGroup}`;
                if (stationYearMap[key]) {
                    averagedData.push({
                        Year: year,
                        StationGroup: stationGroup,
                        "pH Value": stationYearMap[key].sum / stationYearMap[key].count,
                    });
                } else {
                    averagedData.push({
                        Year: year,
                        StationGroup: stationGroup,
                        "pH Value": null
                    });
                }
            });
        });

        console.log("Final Filtered Data (100 points expected):", averagedData.length, "entries");

        //  Build Scales
        const xScale = d3.scaleBand().domain(selectedYears).range([0, width]).padding(0.05);
        const yScale = d3.scaleBand().domain(selectedStationGroups).range([0, height]).padding(0.05);

        //  **New Standard pH Color Scale**
        const colorScale = d3.scaleLinear()
            .domain([0, 6, 7, 8, 14])
            .range(["#ff0000", "#ff8800", "#00cc00", "#0066ff", "#800080"]); // Red → Orange → Green → Blue → Purple

        // Draw heatmap cells
        svg.selectAll("rect")
            .data(averagedData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.Year))
            .attr("y", d => yScale(d.StationGroup))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => d["pH Value"] !== null ? colorScale(d["pH Value"]) : "#ccc") // Grey for missing data
            .attr("stroke", "white");

        // ✅ Add pH values inside cells
        svg.selectAll("text")
            .data(averagedData.filter(d => d["pH Value"] !== null))
            .enter()
            .append("text")
            .attr("x", d => xScale(d.Year) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.StationGroup) + yScale.bandwidth() / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "black")
            .text(d => d["pH Value"].toFixed(1));

        //  Add X-axis (Years)
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        //  Add Y-axis (Station Groups)
        svg.append("g").call(d3.axisLeft(yScale));

        //  **New pH Color Legend (Properly Spaced & Styled)**
        const legendHeight = 180;
        const legendWidth = 15;
        const legendScale = d3.scaleLinear().domain([0, 14]).range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .tickValues([0, 6, 7, 8, 14])
            .tickFormat(d => `pH ${d}`);

        const legend = svg.append("g").attr("transform", `translate(${width + 30}, ${height / 4})`);
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "pHGradient")
            .attr("x1", "0%").attr("x2", "0%")
            .attr("y1", "100%").attr("y2", "0%");

        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff0000"); // Strong Acid (0)
        gradient.append("stop").attr("offset", "40%").attr("stop-color", "#ff8800"); // Weak Acid (6)
        gradient.append("stop").attr("offset", "50%").attr("stop-color", "#00cc00"); // Neutral (7)
        gradient.append("stop").attr("offset", "60%").attr("stop-color", "#0066ff"); // Weak Base (8)
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#800080"); // Strong Base (14)

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#pHGradient)")
            .attr("stroke", "black");

        legend.append("g").attr("transform", `translate(${legendWidth + 5}, 0)`).call(legendAxis);

        // Add Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -15)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Average pH Levels Over 10 Years at 10 Station Groups");

    }).catch(err => {
        console.error("Error loading data:", err);
    });
}
