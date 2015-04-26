var be_nl = d3.locale({
			  "decimal": ",",
			  "thousands": ".",
			  "grouping": [3],
			  "currency": ["€", ""],
			  "dateTime": "%a %b %e %X %Y",
			  "date": "%d/%m/%Y",
			  "time": "%H:%M:%S",
			  "periods": ["", ""],
			  "days": ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
			  "shortDays": ["zo", "ma", "di", "wo", "do", "vr", "za"],
			  "months": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
			  "shortMonths": ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
		  });

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
	var y = d3.scale.linear().domain([0, d3.max(data, function(d) { return d.values; })+10]).range([height, 0]);

	var line = d3.svg.line()
		.x(function(d) { return x(d.key); })
		.y(function(d) { return y(d.values); });

	var zoomtime = d3.behavior.zoom()
		.x(x)//only horizontal panning
		.scaleExtent([1, 12])
		.on("zoom", zooming)
		.on("zoomend", zoomed);

	d3.select("#timeline-container").remove();
	var svg = d3.select(div)
		.append("div")
		.classed("svg-container", true)
		.attr("id", "timeline-container")
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
	var bla = maxDate;
	var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(5)
			.tickFormat(getTTimeFormat(minDate,maxDate));

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
		var t = zoomtime.translate();
		zoomtime.translate([Math.min(t[0], 0), Math.max(t[0], 100)]);
		xAxis.tickFormat(getTTimeFormat(x.domain()[0],x.domain()[1]));
		svg.select(".x.axis").call(xAxis);
		y = y.domain([0,Math.max(10,d3.max(data.filter(function(d){return d.key >= x.domain()[0] && d.key <= x.domain()[1];}), function(d) { return d.values; })+10)]);
		yAxis.scale(y);
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
	var maanden = (maxD-minD)/1000/60/60/24/30;
	var jaren = (maxD-minD)/1000/60/60/24/365;
	//aantal maanden/jaren om van view te wisselen needs tweaking
	if(maanden < 3)
		return be_nl.timeFormat("%d-%m-%Y");
	else if(jaren > 4)
		return be_nl.timeFormat("%Y");
	else
		return be_nl.timeFormat("%b-%Y");
}

Date.prototype.getWeekNumber = function(){
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};//source=http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php

function updateTimeGraph(data, minDate, maxDate){
		//console.log(data);
		/*for(d in data){
			var dat = d3.time.format("%Y-%m-%d").parse(data[d].datum);
			data[d].weekyr = dat.getWeekNumber()+"-"+dat.getFullYear();
			//console.log(data[d]);
		}*/
		/*data.forEach(function(d){
			var dat = d3.time.format("%Y-%m-%d").parse(d.datum);
			d.weekyr = dat.getWeekNumber()+"-"+dat.getFullYear();
		});*/
		data = d3.nest()
				.key(function(d){return d.datum;})
				.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
				.entries(data);
		//console.log(data);
		data.forEach(function(d) {
			//console.log(d.key);
			d.key = d3.time.format("%Y-%m-%d").parse(d.key);
			//console.log(d.key);
			d.values = +d.values;
		});

		data.sort(function(a,b){return a.key - b.key;});
		data.forEach(function(d) {
			if(d.key > new Date())//filter out impossible dates, TODO remove these from the DB
				d.key = null;
		});
		renderTimeLineChart("#monthgraph", data, minDate, maxDate);
}
