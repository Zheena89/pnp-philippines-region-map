const dscc = require('@google/dscc');
const d3 = require('d3');

const GEOJSON_URL =
  'https://raw.githubusercontent.com/statquickdata/pnp-philippines-region-map/main/Philippines_2026_18_Regions.geojson';

let geoData = null;

async function loadGeoJSON() {
  if (!geoData) {
    const response = await fetch(GEOJSON_URL);
    geoData = await response.json();
  }
  return geoData;
}

async function drawViz(data) {
  const geojson = await loadGeoJSON();

  document.body.innerHTML = '';

  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;

  const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip');

  const rows = data.tables.DEFAULT || [];

  const values = {};

  rows.forEach(row => {
    const region = row.region && row.region[0];
    const metric = row.metric && Number(row.metric[0]);

    if (region) {
      values[region] = isNaN(metric) ? 0 : metric;
    }
  });

  const metricValues = Object.values(values);

  const maxValue =
    metricValues.length > 0 ? d3.max(metricValues) : 0;

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, maxValue || 1]);

  const projection = d3
    .geoMercator()
    .fitSize([width, height], geojson);

  const path = d3.geoPath().projection(projection);

  svg
    .selectAll('.region')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('class', 'region')
    .attr('d', path)
    .attr('fill', feature => {
      const region = feature.properties.Region_Display;
      const value = values[region] || 0;

      return value === 0 ? '#eeeeee' : colorScale(value);
    })
    .on('mousemove', function(event, feature) {
      const region = feature.properties.Region_Display;
      const value = values[region] || 0;

      tooltip
        .style('display', 'block')
        .style('left', event.pageX + 12 + 'px')
        .style('top', event.pageY + 12 + 'px')
        .html(
          '<strong>' +
            region +
            '</strong><br>' +
            value.toLocaleString()
        );
    })
    .on('mouseout', function() {
      tooltip.style('display', 'none');
    });
}

dscc.subscribeToData(drawViz, {
  transform: dscc.objectTransform
});
