function renderMonthGraph(minDate, maxDate){

var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

// Parse the date / time
var	parseDate = d3.time.format("%m/%Y").parse;

//var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
	.ticks(d3.time.months)
    .tickFormat(d3.time.format("%b-%Y"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

var svg = d3.select("#monthgraph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data/vlinder_datums/Argusvlinder.csv", function(error, data) {
  data.forEach(function(d) {
    d.date = parseDate(d.Month);
    d.value = +d.x;
  })
data = data.filter(function(d){return d.date >= minDate && d.date <= maxDate;});
  data.sort(function(a,b){return a.date - b.date;});
 x.domain([minDate, maxDate]);
 //x.domain(data.map(function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-90)" );

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Aantal");

  svg.selectAll("bar")
      .data(data)
    .enter().append("rect")
      .style("fill", "steelblue")
      .attr("x", function(d) { return x(d.date) - (width/data.length - 15)/2; })
      .attr("width", width/data.length - 15)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });

});
}

renderMonthGraph(new Date(2009, 0, 1), new Date(2012, 0, 1));