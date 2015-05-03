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

function renderTimeLineChart(div, data){

	var minDate = new Date(2000,0,1); 
	var maxDate = new Date(2000,11,31);
	//data = origdata.filter(function(d){return d.key >= minDate && d.key <= maxDate;});

	var margin = {top: 20, right: 30, bottom: 70, left: 41},
		width = 600 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

	var x = d3.time.scale().domain([minDate, maxDate]).range([0, width]);
	var y = d3.scale.linear().domain([0, 40/*d3.max(data, function(d) { //TODO
		return d.values;
	})+10*/]).range([height, 0]);
	var line = d3.svg.line()
		.x(function(d) { return x(d.key); })
		.y(function(d) { return y(d.values); })
		.interpolate("basis");

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
		//.call(zoomtime)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//necessary so that when zooming graph is not rendered outside of graph
	var innerSvg = svg.append("svg");
	var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(getTTicks2(minDate,maxDate))
			.tickFormat(getTTimeFormat2(minDate,maxDate));

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

	data.forEach(function(d){
		innerSvg.append("path")
		.datum(d)
		.attr("class", "line")
		.attr("id", "line"+d[0].jaar)
		.attr("d", line);
	});
	
	

	function zooming() {
		var t = zoomtime.translate();
		zoomtime.translate([Math.min(t[0], 0), Math.max(t[0], 100)]);
		xAxis.tickFormat(getTTimeFormat2(x.domain()[0],x.domain()[1]));
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

function getTTicks2(minD, maxD){
	var maanden = (maxD-minD)/1000/60/60/24/30;
	//aantal maanden/jaren om van view te wisselen needs tweaking
	if(maanden < 3)
		return d3.time.days;
	else
		return d3.time.months;
}

function getTTimeFormat2(minD, maxD){
	var maanden = (maxD-minD)/1000/60/60/24/30;
	//aantal maanden om van view te wisselen needs tweaking
	if(maanden < 3)
		return be_nl.timeFormat("%d-%m");
	else
		return be_nl.timeFormat("%b");
}

Date.prototype.getWeekNumber = function(){
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return String(d.getFullYear() + "-" + Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7));
};//source=http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php

function updateTimeGraph(inputdata, minDate, maxDate){

		data = d3.nest()
				.key(function(d){return d.datum;})
				.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
				.entries(inputdata);

		weekSums = d3.nest()
				.key(function(d){return  d3.time.format("%Y-%m-%d").parse(d.datum).getWeekNumber();})
				.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
				.entries(inputdata);

		var map = {};
		weekSums.forEach( function( elem ) {
			map[elem.key] = elem.values;
		});

		data.forEach(function(d) {
			d.key = d3.time.format("%Y-%m-%d").parse(d.key); 
			var mapKey = d.key.getWeekNumber();
			d.values = Math.round(map[mapKey] / 7);
		});

		data.sort(function(a,b){return a.key - b.key;});
		data.forEach(function(d) {
			if(d.key > new Date())//filter out impossible dates, TODO remove these from the DB
				d.key = null;
		});

		var data2 = [];
		data.forEach(function(d){
			d.jaar = d.key.getFullYear();
			d.key.setFullYear(2000);
			if(!(d.jaar in data2))
				data2[d.jaar] = new Array();
			data2[d.jaar].push(d);
		});
		renderTimeLineChart("#monthgraph", data2);
}
