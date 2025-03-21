// AirQualityTrends.js
const legendHeight = 40;
const treemapHeight = 300;
const lineChartHeight = 300;
const svgHeight = legendHeight + treemapHeight + lineChartHeight + 10;
const margin = { top: 10, right: 40, bottom: 30, left: 50 }; // Added right margin for dots
const RIGHT_OFFSET = 40; // Space for scroll dots

let globalData = [];
let globalAverages = [];
const metrics = ['pm25_concentration', 'no2_concentration', 'pm10_concentration'];
let currentMetric = metrics[0];
let currentCountry = 'GLOBAL';

const regionNames = {
    'Afr': 'Africa',
    'Eur': 'Europe',
    'Amr': 'Americas',
    'Emr': 'Eastern Mediterranean',
    'Sear': 'South East Asia',
    'NonMS': 'Non-Member',
    'Wpr': 'Western Pacific'
};


const regionAcronyms = {
    'Afr': 'AFR',
    'Eur': 'EUR',
    'Amr': 'AMR',
    'Emr': 'EMR',
    'Sear': 'SEA',
    'NonMS': 'NMS',
    'Wpr': 'WPR'
};
function abbreviateCountry(name) {
    return name.slice(0, 3).toUpperCase();
}

// Computes global averages grouped by year.
function buildGlobalAverages(data) {
    const countryCounts = d3.rollup(
        data,
        v => ({
            pm25: v.filter(d => !isNaN(d.pm25_concentration)).length,
            no2: v.filter(d => !isNaN(d.no2_concentration)).length,
            pm10: v.filter(d => !isNaN(d.pm10_concentration)).length,
        }),
        d => d.country_name
    );

    const validCountries = new Set();
    for (const [country, counts] of countryCounts) {
        if (counts.pm25 >= 2 && counts.no2 >= 2 && counts.pm10 >= 2) {
            validCountries.add(country);
        }
    }

    const filteredData = data.filter(d => validCountries.has(d.country_name));
    const byYear = d3.group(filteredData, d => d.year);
    const result = [];
    for (const [year, arr] of byYear) {
        const pm25Avg = d3.mean(arr, d => d.pm25_concentration) || 0;
        const no2Avg = d3.mean(arr, d => d.no2_concentration) || 0;
        const pm10Avg = d3.mean(arr, d => d.pm10_concentration) || 0;
        result.push({
            country_name: 'GLOBAL',
            year: year,
            pm25_concentration: pm25Avg,
            no2_concentration: no2Avg,
            pm10_concentration: pm10Avg
        });
    }
    result.sort((a, b) => d3.ascending(a.year, b.year));
    return result;
}

// Renders the region legend.
function renderRegionLegend(legendGroup, regions, colorScale) {
    const containerWidth = legendGroup.node().parentNode.getBoundingClientRect().width;
    const useAcronyms = containerWidth < 600; // Switch to acronyms below 600px

    let legendX = 0;
    let legendY = 0;
    const itemSpacing = useAcronyms ? 70 : 140;
    const maxRowWidth = containerWidth - 20;
    const rowHeight = 20;

    legendGroup.selectAll('*').remove();

    regions.forEach(region => {
        const label = useAcronyms ?
            regionAcronyms[region] || region :
            regionNames[region] || region;

        // Check if we need new row
        if (legendX + itemSpacing > maxRowWidth) {
            legendX = 0;
            legendY += rowHeight;
        }

        const g = legendGroup.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        g.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', colorScale(region))
            .attr('stroke', 'white');

        g.append('text')
            .text(label)
            .attr('x', 18)
            .attr('y', 12)
            .attr('fill', 'white')
            .style('font-size', '12px');

        legendX += itemSpacing;
    });

    // Adjust treemap position based on legend height
    const legendHeight = legendY + rowHeight;
    d3.select('.treemap-group')
        .attr('transform', `translate(0, ${legendHeight + 10})`);
}

// Renders the treemap visualization based on the selected metric.
function renderTreemap(metric, data, treemapGroup, svgWidth, treemapHeight, colorScale) {
    const nested = d3.group(data, d => d.region, d => d.country_name);
    const rootData = { name: "AirQuality", children: [] };
    for (const [region, countries] of nested) {
        const regionNode = { name: region, children: [] };
        for (const [country, values] of countries) {
            const avgValue = d3.mean(values, d => d[metric]) || 0;
            regionNode.children.push({
                name: country,
                value: avgValue
            });
        }
        rootData.children.push(regionNode);
    }

    const root = d3.hierarchy(rootData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    d3.treemap()
        .size([svgWidth, treemapHeight])
        .padding(2)(root);

    const nodes = treemapGroup.selectAll('.treenode')
        .data(root.leaves(), d => d.data.name);

    nodes.exit()
        .transition()
        .duration(750)
        .style('opacity', 0)
        .remove();

    const nodesEnter = nodes.enter()
        .append('g')
        .attr('class', 'treenode')
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
        .style('opacity', 0);

    nodesEnter.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => colorScale(d.parent.data.name))
        .attr('stroke', 'black')
        .on('click', (event, d) => {
            updateLineChart(d.data.name);
            currentCountry = d.data.name;
        });

    nodesEnter.append('text')
        .attr('fill', 'white')
        .attr('x', 5)
        .attr('y', 15)
        .style('font-size', '12px')
        .text(d => {
            const nodeWidth = d.x1 - d.x0;
            const nodeHeight = d.y1 - d.y0;
            const abbr = abbreviateCountry(d.data.name);
            const textWidthApprox = abbr.length * 7;
            return (nodeWidth > textWidthApprox + 8 && nodeHeight > 18) ? abbr : '';
        });

    const nodesMerge = nodesEnter.merge(nodes);
    nodesMerge.transition()
        .duration(750)
        .style('opacity', 1)
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    nodesMerge.select('rect')
        .transition()
        .duration(750)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => colorScale(d.parent.data.name));

    nodesMerge.select('text')
        .text(d => {
            const nodeWidth = d.x1 - d.x0;
            const nodeHeight = d.y1 - d.y0;
            const abbr = abbreviateCountry(d.data.name);
            const textWidthApprox = abbr.length * 7;
            return (nodeWidth > textWidthApprox + 8 && nodeHeight > 18) ? abbr : '';
        });
}

// Updates the line chart based on the selected country.
function updateLineChart(countryName) {
    const containerDiv = d3.select('#vis3');
    const containerWidth = containerDiv.node().getBoundingClientRect().width - RIGHT_OFFSET;
    const availableWidth = containerWidth - margin.left - margin.right;
    window.chartWidth = availableWidth;

    d3.select('#vis3 svg').attr('width', containerWidth + RIGHT_OFFSET);
    window.chartTitle.attr('x', availableWidth / 2);
    window.lineLegendGroup.attr('transform', `translate(${availableWidth * 0.85}, ${margin.top})`);
    window.globalButton.style("display", countryName === 'GLOBAL' ? "none" : "block");

    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    let cData = countryName === 'GLOBAL' ? globalAverages : globalData.filter(d => d.country_name === countryName);
    if (cData.length === 0) {
        window.chartTitle.text(`No data available for ${countryName}`);
        window.linesGroup.selectAll('path').remove();
        window.xAxisGroup.selectAll('*').remove();
        window.yAxisGroup.selectAll('*').remove();
        window.linesGroup.selectAll('.data-point').remove();
        return;
    }
    if (countryName !== 'GLOBAL') {
        cData = Array.from(d3.group(cData, d => d.year), ([year, values]) => ({
            year: +year,
            pm25_concentration: d3.mean(values, d => d.pm25_concentration),
            no2_concentration: d3.mean(values, d => d.no2_concentration),
            pm10_concentration: d3.mean(values, d => d.pm10_concentration)
        }));
    }

    window.chartTitle.text(`${countryName}`);
    cData.sort((a, b) => d3.ascending(a.year, b.year));

    const xDomain = d3.extent(cData, d => d.year);
    let maxVal = 0;
    cData.forEach(d => {
        maxVal = Math.max(maxVal, d.pm25_concentration || 0, d.no2_concentration || 0, d.pm10_concentration || 0);
    });
    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, availableWidth]);
    const yScale = d3.scaleLinear()
        .domain([0, maxVal]).nice()
        .range([window.chartHeight - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(yScale).ticks(5);

    window.xAxisGroup
        .attr('transform', `translate(0, ${window.chartHeight - margin.bottom})`)
        .call(xAxis);
    window.xAxisGroup.selectAll('text').attr('fill', 'white');
    window.xAxisGroup.selectAll('line, path').attr('stroke', 'white');

    window.yAxisGroup.call(yAxis);
    window.yAxisGroup.selectAll('text').attr('fill', 'white');
    window.yAxisGroup.selectAll('line, path').attr('stroke', 'white');

    const lineGen = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => xScale(d.year))
        .y(d => yScale(d.value));

    const lineData = [
        { pollutant: 'pm25_concentration', label: 'PM2.5', values: cData.map(d => ({ year: d.year, value: d.pm25_concentration })).filter(d => !isNaN(d.value)) },
        { pollutant: 'no2_concentration', label: 'NO₂', values: cData.map(d => ({ year: d.year, value: d.no2_concentration })).filter(d => !isNaN(d.value)) },
        { pollutant: 'pm10_concentration', label: 'PM10', values: cData.map(d => ({ year: d.year, value: d.pm10_concentration })).filter(d => !isNaN(d.value)) }
    ];

    const lines = window.linesGroup.selectAll('.pollutant-line')
        .data(lineData, d => d.pollutant);
    lines.exit().remove();

    const enterLines = lines.enter().append('path')
        .attr('class', 'pollutant-line')
        .attr('fill', 'none')
        .attr('stroke-width', 2);

    enterLines.merge(lines)
        .transition()
        .duration(500)
        .attr('stroke', d => pollutantScale(d.pollutant))
        .attr('stroke-opacity', d => d.pollutant === currentMetric ? 1 : 0.3)
        .attr('d', d => lineGen(d.values));

    const flatData = lineData.flatMap(d =>
        d.values.map(v => Object.assign({}, v, { pollutant: d.pollutant }))
    );

    const points = window.linesGroup.selectAll('.data-point')
        .data(flatData, d => d.year + "-" + d.pollutant);
    points.exit().remove();

    points.enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("r", 4)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("fill", d => pollutantScale(d.pollutant))
        .attr("fill-opacity", d => d.pollutant === currentMetric ? 1 : 0.3)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`<strong>Country:</strong> ${countryName}<br><strong>Year:</strong> ${d.year}<br><strong>${d.pollutant}:</strong> ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", (event, d) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .merge(points)
        .transition()
        .duration(500)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("fill", d => pollutantScale(d.pollutant))
        .attr("fill-opacity", d => d.pollutant === currentMetric ? 1 : 0.3);
}

// Main visualization initialization.
function initializeVisualization() {
    const containerDiv = d3.select('#vis3').html('');
    const fullWidth = containerDiv.node().getBoundingClientRect().width;
    const containerWidth = fullWidth - RIGHT_OFFSET; // Reserve space for dots
    const availableWidth = containerWidth - margin.left - margin.right;

    // Create controls first
    const controls = containerDiv.append('div')
        .style('display', 'flex')
        .style('gap', '5px')
        .style('margin-bottom', '5px');

    // Create metric dropdown at the top
    const metricSelectContainer = controls.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '5px');

    metricSelectContainer.append('label')
        .attr('for', 'metricSelect')
        .style('color', 'white')
        .style('font-size', '14px')
        .text('Sort by metric:');

    const metricSelect = metricSelectContainer.append('select')
        .attr('id', 'metricSelect')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('border', 'none')
        .style('cursor', 'pointer');

    // Create SVG with reduced width
    const svg = containerDiv.append('svg')
        .attr('width', containerWidth) // Not full width
        .attr('height', svgHeight)
        .style('background', '#222')
        .style('margin-bottom', '50px');

    const legendGroup = svg.append('g')
        .attr('transform', `translate(10, 10)`);

    const treemapGroup = svg.append('g')
        .attr('transform', `translate(0, ${legendHeight})`);

    const lineChartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${legendHeight + treemapHeight + 10})`);

    window.chartWidth = availableWidth;
    window.chartHeight = lineChartHeight;

    // Chart header group
    window.chartHeaderGroup = lineChartGroup.append('g')
        .attr('class', 'chart-header')
        .attr('transform', `translate(0,0)`);

    window.xAxisGroup = lineChartGroup.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${window.chartHeight - margin.bottom})`);

    window.yAxisGroup = lineChartGroup.append('g')
        .attr('class', 'y-axis');

    window.globalButton = window.chartHeaderGroup.append('text')
        .attr('x', availableWidth / 2)
        .attr('y', margin.top)
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle') // Center the button
        .style('font-size', '12px')
        .style('cursor', 'pointer')
        .text('View Global Data')
        .on('click', () => updateLineChart('GLOBAL'));

    // Chart title below button
    window.chartTitle = window.chartHeaderGroup.append('text')
        .attr('x', availableWidth / 2)
        .attr('y', margin.top + 20) // Position below button
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('Loading Global Pollutant Trends...');

    window.linesGroup = lineChartGroup.append('g')
        .attr('class', 'lines-group');

    // Define pollutant color scale.
    window.pollutantScale = d3.scaleOrdinal()
        .domain(metrics)
        .range(['#00FFFF', '#FF00FF', '#FFFF00']);

    window.lineLegendGroup = lineChartGroup.append('g')
        .attr('class', 'line-legend')
        .attr('transform', `translate(${availableWidth * 0.85}, ${margin.top})`);

    window.lineLegendGroup.selectAll('*').remove();
    metrics.forEach((d, i) => {
        const labelMapping = {
            'pm25_concentration': 'PM2.5 (µg/m³)',
            'no2_concentration': 'NO₂ (ppm)',
            'pm10_concentration': 'PM10 (µg/m³)'
        };
        const legendItem = window.lineLegendGroup.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        legendItem.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', pollutantScale(d));
        legendItem.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .attr('fill', 'white')
            .style('font-size', '12px')
            .text(labelMapping[d]);
    });

    // Load CSV data and build visualizations.
    d3.csv("data/air_quality.csv").then(rawData => {
        rawData.forEach(d => {
            d.pm25_concentration = +d.pm25_concentration;
            d.pm10_concentration = +d.pm10_concentration;
            d.no2_concentration = +d.no2_concentration;
            d.year = +d.year;
        });

        // AirQualityTrends.js (continued from previous code)

        rawData = rawData.filter(d => d.year && (
            !isNaN(d.pm25_concentration) ||
            !isNaN(d.pm10_concentration) ||
            !isNaN(d.no2_concentration)
        ));

        rawData.forEach(d => {
            const parts = d.who_region.split('_');
            d.region = parts.length > 1 ? parts[1] : d.who_region;
        });

        globalData = rawData;
        globalAverages = buildGlobalAverages(rawData);

        const regionsSet = new Set(rawData.map(d => d.region));
        const regions = Array.from(regionsSet);
        const colorScale = d3.scaleOrdinal()
            .domain(regions)
            .range(d3.schemeCategory10);

        renderRegionLegend(legendGroup, regions, colorScale);

        metricSelect.selectAll('option')
            .data(metrics)
            .enter()
            .append('option')
            .attr('value', d => d)
            .property('selected', d => d === currentMetric)
            .text(d => {
                const labelMapping = {
                    'pm25_concentration': 'PM2.5 (µg/m³)',
                    'no2_concentration': 'NO₂ (ppm)',
                    'pm10_concentration': 'PM10 (µg/m³)'
                };
                return labelMapping[d];
            });

        // When the dropdown selection changes, update the current metric and re-render.
        metricSelect.on('change', function() {
            currentMetric = this.value;
            const newWidth = containerDiv.node().getBoundingClientRect().width - RIGHT_OFFSET;
            window.chartWidth = newWidth - margin.left - margin.right;
            renderTreemap(currentMetric, globalData, treemapGroup, newWidth, treemapHeight, colorScale);
            updateLineChart(currentCountry);
        });

        renderTreemap(currentMetric, globalData, treemapGroup, containerWidth, treemapHeight, colorScale);
        updateLineChart('GLOBAL');
        window.addEventListener('resize', () => {
            const containerDiv = d3.select('#vis3');
            const newWidth = containerDiv.node().getBoundingClientRect().width - RIGHT_OFFSET;

            // Re-render components
            const regionsSet = new Set(globalData.map(d => d.region));
            const regions = Array.from(regionsSet);
            const colorScale = d3.scaleOrdinal()
                .domain(regions)
                .range(d3.schemeCategory10);

            renderRegionLegend(legendGroup, regions, colorScale);
            renderTreemap(currentMetric, globalData, treemapGroup, newWidth, treemapHeight, colorScale);
            updateLineChart(currentCountry);
        });
    }).catch(err => {
        console.error("Error loading CSV:", err);
    });
}

// Exported initialization function.
export function initAirQualityTrends() {
    initializeVisualization();
}