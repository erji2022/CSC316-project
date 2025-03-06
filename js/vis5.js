export function renderClimateChart() {
    const margin = {top: 40, right: 60, bottom: 40, left: 60},
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#vis5")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const parseCO2 = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && !line.startsWith("#"));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            const year = +cols[0];
            const ppm = +cols[4];
            return {year, co2: ppm};
        })
    }

    const parseTemp = (raw) => {
        const lines = raw.split("\n")
            .filter(line => line.trim() !== "" && /^\d/.test(line.trim()));
        return lines.map(line => {
            const cols = line.trim().split(/\s+/);
            const year = +cols[0];
            const anomaly = +cols[2];
            return {year, temp: anomaly}
        })
    }

    Promise.all([
        d3.text("data/co2-mm-mlo.txt"),
        d3.text("data/land-ocean-temperature.txt")
    ]).then(([co2Raw, tempRaw]) => {
        const co2Data = parseCO2(co2Raw);
        const tempData = parseTemp(tempRaw);

        const co2ByYear = d3.rollups(co2Data,
            v => d3.mean(v, d => d.co2),
            d => d.year
        ).map(([year, avgCO2]) => ({year, co2: avgCO2}));

        const combinedData = [];
        tempData.forEach(t => {
            const co2Obj = co2ByYear.find(c => c.year === t.year);
            if (co2Obj) {
                combinedData.push({
                    year: t.year,
                    temp: t.temp,
                    co2: co2Obj.co2
                })
            }
            combinedData.sort((a, b) => a.temp - b.temp);

            const x = d3.scaleBand()
                .domain(combinedData.map(d => d.year))
                .range([0, width])
                .padding(0.1);

            const yTemp = d3.scaleLinear()
                .domain([d3.min(combinedData, d => d.temp), d3.max(combinedData, d => d.temp)])
                .nice()
                .range([height, 0]);

            const yCO2 = d3.scaleLinear()
                .domain([d3.min(combinedData, d => d.co2), d3.max(combinedData, d => d.co2)])
                .nice()
                .range([height, 0]);

        //     svg.selectAll(".bar")
        //         .data(combinedData)
        //         .enter()
        //         .append("rect")
        //         .attr("class", "bar")
        //         .attr("x", d => x(d.year))
        //         .attr("y", d => d.temp >= 0 ? yTemp(d.temp) : yTemp(0))
        //         .attr("width", x.bandwidth())
        //         .attr("height", d => Math.abs(yTemp(d.temp) - yTemp(0)))
        //         .attr("fill", d => d.temp < 0 ? "steelblue" : "tomato");
        })
    })
}