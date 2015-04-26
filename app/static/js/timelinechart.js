function renderTimeLineChart(div, origdata, minDate, maxDate){

	if(minDate == null || maxDate == null){
		domm = d3.extent(origdata, function(d){ return d.key; });
		minDate = domm[0];
		maxDate = domm[1];
	}
	data = origdata.filter(function(d){return d.key >= minDate && d.key <= maxDate;});

	var margin = {top: 20, right: 30, bottom: 70, left: 41},
		width = 600 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	var x = d3.time.scale().domain([minDate, maxDate]).range([0, width]);
	var y = d3.scale.linear().domain([0, d3.max(data, function(d) { return d.values; })]).range([height, 0]);

	var line = d3.svg.line()
		.x(function(d) { return x(d.key); })
		.y(function(d) { return y(d.values); });

	var zoomtime = d3.behavior.zoom()
		.x(x)
		//.y(y)
		.scaleExtent([1, 256])
		.on("zoom", zooming)
		.on("zoomend", zoomed);

	d3.select("#svggraph").remove();
	var svg = d3.select(div)
		.append("div")
		.classed("svg-container", true)
		.append("svg")
		.attr("preserveAspectRatio", "xMinYMin meet")
		.attr("viewBox", "0 0 600 300")
		.classed("svg-content-responsive", true)
		.attr("id", "svggraph")
		.call(zoomtime)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//necessary so that when zooming graph is not rendered outside of graph
	var innerSvg = svg.append("svg");

	var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(5);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
	.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", "-.55em")
		.attr("transform", "translate(20,12)" );

	var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			.ticks(5);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
	.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Aantal");

	innerSvg.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line);

	function zooming() {
		svg.select(".x.axis").call(xAxis);
		svg.select(".y.axis").call(yAxis);
		innerSvg.select(".line")
			.attr("class", "line")
			.attr("d", line);
	}

	function zoomed() {
		minDate = x.domain()[0];
		maxDate = x.domain()[1];
		binMap.filterData(minDate, maxDate);
	}
}

function getTTicks(minD, maxD){
	var maanden = (maxDate-minDate)/1000/60/60/24/30;
	var jaren = (maxDate-minDate)/1000/60/60/24/365;
	//aantal maanden/jaren om van view te wisselen needs tweaking
	if(maanden < 3)
		return d3.time.days;
	else if(jaren > 4)
		return d3.time.years;
	else
		return d3.time.months;
}

function getTTimeFormat(minD, maxD){
	var maanden = (maxDate-minDate)/1000/60/60/24/30;
	var jaren = (maxDate-minDate)/1000/60/60/24/365;
	//aantal maanden/jaren om van view te wisselen needs tweaking
	if(maanden < 3)
		return d3.time.format("%d-%m-%Y");
	else if(jaren > 4)
		return d3.time.format("%Y");
	else
		return d3.time.format("%b-%Y");
}

function updateTimeGraph(data, minDate, maxDate){
		data = d3.nest()
				.key(function(d){return d.datum;})
				.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
				.entries(data);
		data.forEach(function(d) {
			d.key = d3.time.format("%Y-%m-%d").parse(d.key);
			d.values = +d.values;
		});

		data.sort(function(a,b){return a.key - b.key;});
		data.forEach(function(d) {
			if(d.key > new Date())//filter out impossible dates, TODO remove these from the DB
				d.key = null;
		});
		renderTimeLineChart("#monthgraph", data, minDate, maxDate);
}
