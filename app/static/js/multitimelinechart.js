var monthGraph = (function () {

  var monthGraph = {};

	// configuration
	var margin = {top: 2, right: 30, bottom: 2, left: 41, axis: 20},
			width = 600 - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom,
			vlindersHeight = 200,
			weerHeight = 150;
	var minDate = new Date(2000,0,1),
			maxDate = new Date(2000,12,31);

	//local variables
	var svg, x;
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

	var images = [{name: 'tmax', selected: true, img: "/static/img/tmax.png", selectedimg: "/static/img/tmax_selected.png", x: 0, width: 29}, 
		{name: 'tmin', selected: false, img: "/static/img/tmin.png", selectedimg: "/static/img/tmin_selected.png", x: 29, width: 29}, 
		{name: 'neerslag', selected: false, img: "/static/img/neerslag.png", selectedimg: "/static/img/neerslag_selected.png", x: 75, width: 63}];

	monthGraph.create = function() {
		// create SVG container
		d3.select("#timeline-container").remove();
		svg = d3.select("#monthgraph")
			.append("div")
			.classed("svg-container-timeline", true)
			.attr("id", "timeline-container")
			.append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", "0 0 " + width + " " + (height + margin.top + margin.bottom + margin.axis))
			.classed("svg-content-responsive", true)
			.attr("id", "svggraph")
			//.call(zoomtime)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};

	monthGraph.update = function(butterflyData, weatherData) {
		// prepare data
		var butterflyData = prepareButterflyData(butterflyData);
		var weatherData = prepareWeatherData(weatherData);

		// compute x-axis bounds
		var minnDate = maxDate;
		butterflyData.forEach(function(d){
			var min = d3.min(d, function(d2){
				return d2.key;
			});
			if(min < minnDate)
				minnDate = min;
		});
		minnDate.setDate(1);

		var maxxDate = minDate;
		butterflyData.forEach(function(d){
			var max = d3.max(d, function(d2){
				return d2.key;
			});
			if(max > maxxDate)
				maxxDate = max;
		});
		maxxDate.setDate(30);

		// create SVG
		monthGraph.create();

		// setup x-axis
		x = d3.time.scale().domain([minnDate, maxxDate]).range([0, width - margin.right]);

		var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(getTTicks2(minnDate,maxxDate))
				.tickFormat(getTTimeFormat2(minnDate,maxxDate));

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + (vlindersHeight + margin.top + 5) + ")")
			.call(xAxis)
		.selectAll("text")
			.style("text-anchor", "end")
			.attr("dx", "-.8em")
			.attr("dy", "-.55em")
			.attr("transform", "translate(27,2)" );

		// show data
		updateButterflyData(butterflyData);
		updateWeatherData(weatherData);
	};

	var updateButterflyData = function(data) {

		// largest y-value
		var max = 0;
		data.forEach(function(d){
			var m = d3.max(d, function(d2){
				return d2.values;
			});
			if(m > max)
				max = m;
		});

		// setup y-axis
		var y1 = d3.scale.linear().domain([0, Math.round(max / 10) * 10]).range([vlindersHeight, 0]);

		var yAxis1 = d3.svg.axis()
				.scale(y1)
				.orient("left")
				.ticks(5);

		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0," + margin.top + ")")
			.call(yAxis1)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Aantal");

		// define lines
		var line = d3.svg.line()
			.x(function(d) { return x(d.key); })
			.y(function(d) { return y1(d.values); })
			.interpolate("basis");

		// define zoom behaviour
		var zoomtime = d3.behavior.zoom()
			.x(x)//only horizontal panning
			.scaleExtent([1, 12])
			.on("zoom", zooming)
			.on("zoomend", zoomed);

		// draw lines and define click behaviour
		var innerSvg = svg.append("svg");
		data.forEach(function(d){
			innerSvg.append("path")
			.datum(d)
			.attr("class", "activeLine")
			.attr("transform", "translate(0," + margin.top + ")")
			.attr("id", "line"+d[0].jaar)
			.attr("d", line)
			.on("mouseover", function(){
					var hoveredLine = d3.select(this);
					if (!hoveredLine.classed("activeLine")) {
						var hoveredYear = d3.select(this).attr("id").substring(4);
						d3.selectAll("#bar"+hoveredYear).attr("class", "highlightedBar");
						d3.selectAll("#line"+hoveredYear).attr("class", "highlightedLine");
					}
			})
			.on("mouseout", function(){
				var hoveredLine = d3.select(this);
				if (!hoveredLine.classed("activeLine")) {
					d3.selectAll(".highlightedBar").attr("class", "bar");
					d3.selectAll(".highlightedLine").attr("class", "line");
				}
			})
			.on("click", function(){
				var clickedYear = d3.select(this).attr("id").substring(4);
				if (selectedYear == 0) {
					selectedYear = clickedYear;
					updateYear(clickedYear);
					d3.selectAll(".activeBar").attr("class", "bar");
					d3.selectAll(".activeLine").attr("class", "line");
					d3.selectAll("#bar"+clickedYear).attr("class", "activeBar");
					d3.selectAll("#line"+clickedYear).attr("class", "activeLine");
				} else if(selectedYear != clickedYear) {
					d3.selectAll("#line"+selectedYear).attr("class", "line");
					selectedYear = clickedYear;
					updateYear(clickedYear);
					d3.selectAll(".activeBar").attr("class", "bar");
					d3.selectAll("#bar"+clickedYear).attr("class", "activeBar");
					d3.selectAll("#line"+clickedYear).attr("class", "activeLine");
				}else{
					//deselect year
					d3.selectAll("#line"+selectedYear).attr("class", "line");
					selectedYear = 0;
					d3.selectAll(".bar").attr("class", "activeBar");
					updateSoort(selectedSoort);
				}
			});
		});

	};

	var updateWeatherData = function(data) {
		// largest y-value
		var max = 0;
		data.forEach(function(d){
			var m = d3.max(d, function(d2){
				return d2.values;
			});
			if(m > max)
				max = m;
		});

		var y = d3.scale.linear().domain([0, Math.round(max / 10) * 10]).range([weerHeight, 0]);

		var line = d3.svg.line()
			.x(function(d) { return x(d.key); })
			.y(function(d) { return y(d.values); })
			.interpolate("basis");

		var zoomtime = d3.behavior.zoom()
			.x(x)//only horizontal panning
			.scaleExtent([1, 12])
			.on("zoom", zooming)
			.on("zoomend", zoomed);

		var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(5);

		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0," + (vlindersHeight + margin.top + margin.axis) + ")")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(selectedWeather);

		var innerSvg = svg.append("svg");
		for (jaar in data) {
			innerSvg.append("path")
				.datum(data[jaar])
				.attr("class", "activeLine")
				.attr("transform", "translate(0," + (vlindersHeight + margin.top + margin.axis) + ")")
				.attr("id", "line" + jaar)
				.attr("d", line)
				.on("mouseover", function(){
						var hoveredLine = d3.select(this);
						if (!hoveredLine.classed("activeLine")) {
							var hoveredYear = d3.select(this).attr("id").substring(4);
							d3.selectAll("#bar"+hoveredYear).attr("class", "highlightedBar");
							d3.selectAll("#line"+hoveredYear).attr("class", "highlightedLine");
						}
				})
				.on("mouseout", function(){
					var hoveredLine = d3.select(this);
					if (!hoveredLine.classed("activeLine")) {
						d3.selectAll(".highlightedBar").attr("class", "bar");
						d3.selectAll(".highlightedLine").attr("class", "line");
					}
				})
				.on("click", function(){
					var clickedYear = d3.select(this).attr("id").substring(4);
					if (selectedYear == 0) {
						selectedYear = clickedYear;
						updateYear(clickedYear);
						d3.selectAll(".activeBar").attr("class", "bar");
						d3.selectAll(".activeLine").attr("class", "line");
						d3.selectAll("#bar"+clickedYear).attr("class", "activeBar");
						d3.selectAll("#line"+clickedYear).attr("class", "activeLine");
					} else if(selectedYear != clickedYear) {
						d3.selectAll("#line"+selectedYear).attr("class", "line");
						selectedYear = clickedYear;
						updateYear(clickedYear);
						d3.selectAll(".activeBar").attr("class", "bar");
						d3.selectAll("#bar"+clickedYear).attr("class", "activeBar");
						d3.selectAll("#line"+clickedYear).attr("class", "activeLine");
					}else{
						//deselect year
						d3.selectAll("#line"+selectedYear).attr("class", "line");
						selectedYear = 0;
						d3.selectAll(".bar").attr("class", "activeBar");
						updateSoort(selectedSoort);
					}
				});
		};
		showButtons(innerSvg);
		
	};

	var showButtons = function(innerSvg) {
		//add temp & precip buttons
		var img = innerSvg.selectAll("image")
			.data(images)
			.enter()
			.append("svg:image")
		    .attr("xlink:href", function(d) {
		    	if(d.selected)
			    	return d.selectedimg;
			    else return d.img;
			})
			.attr("width", function(d) {
		    	return d.width;
		    })
		    .attr("height", 53)
		    .attr("x", function(d,i) {
		    	return 250 + i*29;
		    })
		    .attr("y",330)
		    .on("click", function(d) {
		    	if(!d.selected) {
		    		//select this image, unselect other images
		    		removeSelections();
		    		d.selected = true;
		    		img.attr("xlink:href", function(d) {
				    	if(d.selected)
					    	return d.selectedimg;
					    else return d.img;
					})
					changeWeather(d.name);
		    	}
		    });
	}

	var removeSelections = function() {
		images.forEach(function(d) {
			d.selected = false;
		});
	};

	var prepareButterflyData = function(inputdata){
			// create array [{datum, aantal vlinders die dag}]
			data = d3.nest()
					.key(function(d){return d.datum;})
					.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
					.entries(inputdata);

			// create hashmap [{week, aantal vlinders}]
			weekSums = d3.nest()
					.key(function(d){return  d3.time.format("%Y-%m-%d").parse(d.datum).getWeekNumber();})
					.rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});})
					.entries(inputdata);

			var map = {};
			weekSums.forEach( function( elem ) {
				map[elem.key] = elem.values;
			});

			// transform array [{datum, aantal vlinders die dag}] -> [{datum, aantal vlinders die week}]
			data.forEach(function(d) {
				d.key = d3.time.format("%Y-%m-%d").parse(d.key);
				var mapKey = d.key.getWeekNumber();
				d.values = Math.round(map[mapKey] / 7);
			});

			// sorteer data op de datum
			data.sort(function(a,b){return a.key - b.key;});
			data.forEach(function(d) {
				if(d.key > new Date())//filter out impossible dates, TODO remove these from the DB
					d.key = null;
			});

			// group all data per year
			var perYearData = [];
			data.forEach(function(d){
				d.jaar = d.key.getFullYear();
				d.key.setFullYear(2000);
				if(!(d.jaar in perYearData))
					perYearData[d.jaar] = new Array();
				perYearData[d.jaar].push(d);
			});

			return perYearData;
	};

	function prepareWeatherData(inputdata){
			var perYearData = [];
			inputdata.forEach(function(d){
				if(!(d.jaar in perYearData))
					perYearData[d.jaar] = new Array();
				var day = firstDayOfWeek(2000, d.week);
				if(selectedWeather == 'tmax') {
					perYearData[d.jaar].push({"key": day, "values": d.tmax});
				} else { 
					if(selectedWeather == 'tmin') {
						perYearData[d.jaar].push({"key": day, "values": d.tmin});
					} else perYearData[d.jaar].push({"key": day, "values": d.neerslag});
				}
			});

			return perYearData;
	}


	var zooming = function() {
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

	var zoomed = function() {
		minDate = x.domain()[0];
		maxDate = x.domain()[1];
		binMap.filterData(minDate, maxDate);
	}

	var getTTicks2 = function(minD, maxD){
		var maanden = (maxD-minD)/1000/60/60/24/30;
		//aantal maanden/jaren om van view te wisselen needs tweaking
		if(maanden < 3)
			return d3.time.days;
		else
			return d3.time.months;
	}

	var getTTimeFormat2 = function(minD, maxD){
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

	var firstDayOfWeek =  function(y, w) {
		var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

    return new Date(y, 0, d);
	}

	return monthGraph;

})();
