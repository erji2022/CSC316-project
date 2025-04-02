export function renderPHHeatmap() {
    const margin = { top: 30, right: 150, bottom: 50, left: 120 },
        containerWidth = document.querySelector("#vis6").clientWidth,
        width = containerWidth - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svgContainer = d3.select("#vis6");
    svgContainer.select("svg").remove();
    d3.select("body").select("div.tooltip").remove(); // remove any existing tooltip

    const svg = svgContainer
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#f9f9f9")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", "1000");

    d3.csv("data/pH.csv").then(data => {
        data.forEach(d => {
            d["Station"] = d["GEMS Station Number"].trim();
            d["Station Group"] = d["Station"].slice(0, 1);
            d["Year"] = d["Sample Date"].trim().slice(0, 4);
            d["pH Value"] = parseFloat(d["Value"].trim());
        });

        data = data.filter(d => !isNaN(d["pH Value"]));

        const allYears = [...new Set(data.map(d => d.Year))].sort();
        const allStationGroups = [...new Set(data.map(d => d["Station Group"]))].sort();
        const selectedStationGroups = allStationGroups.slice(0, 10);

        const yearRangeSelect = document.querySelector("#yearRange");

        function getCategory(ph) {
            if (ph === null) return "No Data";
            if (ph < 6) return "Acidic";
            if (ph < 7) return "Slightly Acidic";
            if (ph === 7) return "Neutral";
            if (ph < 8) return "Slightly Basic";
            return "Basic";
        }

        function getFilteredYears(range) {
            if (range === "all") {
                const step = Math.floor(allYears.length / 10);
                return allYears.filter((_, i) => i % step === 0).slice(0, 10);
            } else {
                const [start, end] = range.split("-").map(Number);
                const subset = allYears.filter(y => +y >= start && +y <= end);
                const step = Math.max(1, Math.floor(subset.length / 10));
                return subset.filter((_, i) => i % step === 0).slice(0, 10);
            }
        }

        function drawHeatmap(selectedYears) {
            const stationYearMap = {};
            data.forEach(d => {
                if (selectedYears.includes(d.Year) && selectedStationGroups.includes(d["Station Group"])) {
                    const key = `${d.Year}-${d["Station Group"]}`;
                    if (!stationYearMap[key]) stationYearMap[key] = { sum: 0, count: 0 };
                    stationYearMap[key].sum += d["pH Value"];
                    stationYearMap[key].count += 1;
                }
            });

            const averagedData = [];
            selectedYears.forEach(year => {
                selectedStationGroups.forEach(group => {
                    const key = `${year}-${group}`;
                    averagedData.push({
                        Year: year,
                        StationGroup: group,
                        "pH Value": stationYearMap[key]
                            ? stationYearMap[key].sum / stationYearMap[key].count
                            : null
                    });
                });
            });

            const xScale = d3.scaleBand().domain(selectedYears).range([0, width]).padding(0.05);
            const yScale = d3.scaleBand().domain(selectedStationGroups).range([0, height]).padding(0.05);
            const colorScale = d3.scaleLinear()
                .domain([0, 6, 7, 8, 14])
                .range(["#ff0000", "#ff8800", "#00cc00", "#0066ff", "#800080"]);

            svg.selectAll(".x-axis, .y-axis, .legend, .heat-title, .heat-label").remove();

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(yScale));

            const cells = svg.selectAll("rect.heat-cell")
                .data(averagedData, d => d.Year + "-" + d.StationGroup);

            const mergedCells = cells.enter()
                .append("rect")
                .attr("class", "heat-cell")
                .merge(cells);

            mergedCells
                .attr("x", d => xScale(d.Year))
                .attr("y", d => yScale(d.StationGroup))
                .attr("width", xScale.bandwidth())
                .attr("height", yScale.bandwidth())
                .attr("fill", d => d["pH Value"] !== null ? colorScale(d["pH Value"]) : "#ccc")
                .attr("opacity", 1)
                .on("mouseover", function (event, d) {
                    if (d["pH Value"] === null) return;

                    tooltip.transition().duration(150).style("opacity", 1);
                    tooltip.html(`
                        <strong>Station Group:</strong> ${d.StationGroup}<br>
                        <strong>Year:</strong> ${d.Year}<br>
                        <strong>Avg pH:</strong> ${d["pH Value"].toFixed(2)}<br>
                        <strong>Category:</strong> ${getCategory(d["pH Value"])}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 40) + "px");
                })
                .on("mouseout", () => {
                    tooltip.transition().duration(300).style("opacity", 0);
                });

            cells.exit().transition().duration(400).attr("opacity", 0).remove();

            svg.selectAll(".heat-label")
                .data(averagedData.filter(d => d["pH Value"] !== null))
                .enter()
                .append("text")
                .attr("class", "heat-label")
                .attr("x", d => xScale(d.Year) + xScale.bandwidth() / 2)
                .attr("y", d => yScale(d.StationGroup) + yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("fill", "black")
                .style("opacity", 0)
                .text(d => d["pH Value"].toFixed(1))
                .transition()
                .duration(600)
                .style("opacity", 1);

            svg.append("text")
                .attr("class", "heat-title")
                .attr("x", width / 2)
                .attr("y", -15)
                .style("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Average pH Levels Over Selected Years at 10 Station Groups");

            const legendHeight = 180;
            const legendWidth = 15;
            const legendScale = d3.scaleLinear().domain([0, 14]).range([legendHeight, 0]);
            const legendAxis = d3.axisRight(legendScale)
                .tickValues([0, 6, 7, 8, 14])
                .tickFormat(d => `pH ${d}`);

            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width + 30}, ${height / 4})`);

            const defs = svg.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", "pHGradient")
                .attr("x1", "0%").attr("x2", "0%")
                .attr("y1", "100%").attr("y2", "0%");

            gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff0000");
            gradient.append("stop").attr("offset", "40%").attr("stop-color", "#ff8800");
            gradient.append("stop").attr("offset", "50%").attr("stop-color", "#00cc00");
            gradient.append("stop").attr("offset", "60%").attr("stop-color", "#0066ff");
            gradient.append("stop").attr("offset", "100%").attr("stop-color", "#800080");

            legend.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#pHGradient)")
                .attr("stroke", "black");

            legend.append("g")
                .attr("transform", `translate(${legendWidth + 5}, 0)`)
                .call(legendAxis);
        }

        const defaultValue = yearRangeSelect.value || "all";
        drawHeatmap(getFilteredYears(defaultValue));

        yearRangeSelect.addEventListener("change", () => {
            drawHeatmap(getFilteredYears(yearRangeSelect.value));
        });
    });
}

