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
        d3.text("data/land-ocean-temperature.text")
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
        })
    })
}