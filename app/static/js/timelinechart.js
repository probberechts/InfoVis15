function renderTimeLineChart(div, data, minDate, maxDate){

console.log();
var maanden = (maxDate-minDate)/1000/60/60/24/30;
var jaren = (maxDate-minDate)/1000/60/60/24/365;
var tticks = d3.time.months;
var ttickFormat = d3.time.format("%b-%Y");
//aantal maanden/jaren om van view te wisselen needs tweaking
if(maanden < 3){
	tticks = d3.time.days;
	ttickFormat = d3.time.format("%d-%m-%Y");
}else if(jaren > 4){
	tticks = d3.time.years;
	ttickFormat = d3.time.format("%Y");
}
	
	var margin = {top: 20, right: 20, bottom: 70, left: 40},
		width = 600 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(tticks)
		.tickFormat(ttickFormat);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

	d3.select("#svggraph").remove();
	var svg = d3.select(div).append("svg")
		.attr("id", "svggraph")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform",
			  "translate(" + margin.left + "," + margin.top + ")");

	x.domain([minDate, maxDate]);
	y.domain([0, d3.max(data, function(d) { return d.values; })]);

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

	var line = d3.svg.line()
		.x(function(d) { return x(d.key); })
		.y(function(d) { return y(d.values); });
	
	svg.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line);
}
