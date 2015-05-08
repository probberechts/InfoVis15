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
	var svg, x, xAxis, yB, yW, yAxisB, yAxisW;
  var dataB, dataW;
  var selectedWeather = "tmax";
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


	var images = [{name: 'tmax', selected: true, img: "/static/img/tmax.png", selectedimg: "/static/img/tmax_selected.png", x: 0, width: 15},
		{name: 'tmin', selected: false, img: "/static/img/tmin.png", selectedimg: "/static/img/tmin_selected.png", x: 29, width: 15}];

	var zooming = function() {
		var z = zoomtime();
		var t = z.translate();
		z.translate([Math.min(t[0], 0), Math.max(t[0], 100)]);
		//xAxis.tickFormat(getTTimeFormat2(x.domain()[0],x.domain()[1]));
		svg.select(".x.axis").call(xAxis);

    var max = 10;
    var tmp = [];
    dataB.forEach(function(dt) {
      tmp = d3.max(dt.filter(function(d){return d.key >= x.domain()[0] && d.key <= x.domain()[1] ;}), function(d) { return d.values; });
      if (tmp > max) max = tmp;
    });
    yB = yB.domain( [0, max+10] );
    yAxisB.scale(yB);
    svg.select("#yaxisB").call(yAxisB);

    var max = 0;
    var tmp = max;
    dataW.forEach(function(dt) {
      tmp = d3.max(dt.filter(function(d){return d.key >= x.domain()[0] && d.key <= x.domain()[1] ;}), function(d) { return d.values; });
      if (tmp > max) max = tmp;
    });
    var min = 20;
    var tmp = min;
    dataW.forEach(function(dt) {
      tmp = d3.min(dt.filter(function(d){return d.key >= x.domain()[0] && d.key <= x.domain()[1] ;}), function(d) { return d.values; });
      if (tmp < min) min = tmp;
    });
    yW = yW.domain( [min-5,max+5]);
    yAxisW.scale(yW);
    svg.select("#yaxisW").call(yAxisW);

		svg.selectAll(".B")
			.attr("d", lineB)
		svg.selectAll(".W")
			.attr("d", lineW);
	};

	var zoomed = function() {
		minDate = x.domain()[0];
		maxDate = x.domain()[1];
		binMap.filterData(minDate, maxDate);
	};

	var zoomtime = function(){
		return d3.behavior.zoom()
		  .x(x)//only horizontal panning
		  .scaleExtent([1, 10])
		  .on("zoom", zooming)
		  .on("zoomend", zoomed);
	};

	// define lines
	var lineB = d3.svg.line()
		.x(function(d) { return x(d.key); })
		.y(function(d) { return yB(d.values); })
		.interpolate("basis");

	var lineW = d3.svg.line()
			.x(function(d) { return x(d.key); })
			.y(function(d) { return yW(d.values); })
			.interpolate("basis");

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
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};

	monthGraph.update = function(butterflyData, weatherData) {
		// prepare data
		dataB = prepareButterflyData(butterflyData);
		dataW = prepareWeatherData(weatherData);

		// compute x-axis bounds
		var minnDate = maxDate;
		dataB.forEach(function(d){
			var min = d3.min(d, function(d2){
				return d2.key;
			});
			if(min < minnDate)
				minnDate = min;
		});
		minnDate.setDate(1);

		var maxxDate = minDate;
		dataB.forEach(function(d){
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

		xAxis = d3.svg.axis()
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
		updateButterflyData(dataB);
		updateWeatherData(dataW);

    // enable zoom
    d3.select("#monthgraph").call(zoomtime());
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
		yB = d3.scale.linear().domain([0, Math.round(max / 10) * 10]).range([vlindersHeight, 0]);

		yAxisB = d3.svg.axis()
				.scale(yB)
				.orient("left")
				.ticks(5);

		svg.append("g")
			.attr("class", "y axis")
			.attr("id", "yaxisB")
			.attr("transform", "translate(0," + margin.top + ")")
			.call(yAxisB)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Aantal");

		// draw lines and define click behaviour
		var innerSvg = svg.append("svg");
		data.forEach(function(d){
			innerSvg.append("path")
			.datum(d)
			.attr("class", "line B activeLine")
			.attr("transform", "translate(0," + margin.top + ")")
			.attr("id", "lineB"+d[0].jaar)
			.attr("d", lineB)
			.on("mouseover", function(){
					var hoveredLine = d3.select(this);
					if (!hoveredLine.classed("activeLine")) {
						var hoveredYear = d3.select(this).attr("id").substring(5);
						d3.select("#bar"+hoveredYear).classed("highlightedBar", true);
						d3.select("#lineB"+hoveredYear).classed("highlightedLine", true);
            d3.select("#lineW"+hoveredYear).classed("highlightedLine", true);
					}
			})
			.on("mouseout", function(){
				var hoveredLine = d3.select(this);
				if (!hoveredLine.classed("activeLine")) {
					d3.selectAll(".highlightedBar").classed("highlightedBar", false);
					d3.selectAll(".highlightedLine").classed("highlightedLine", false);
				}
			})
			.on("click", function(){
				var clickedYear = d3.select(this).attr("id").substring(5);
				if (selectedYear == 0) { // all years are selected
          d3.selectAll(".activeBar").classed("activeBar", false);
          d3.selectAll(".activeLine").classed("activeLine", false);
					selectedYear = clickedYear;
					updateYear(clickedYear);
					d3.select("#bar"+clickedYear).classed("activeBar", true);
					d3.select("#lineB"+clickedYear).classed("activeLine", true);
          d3.select("#lineW"+clickedYear).classed("activeLine", true);
				} else if(selectedYear != clickedYear) { // select a different year
          d3.select("#bar"+selectedYear).classed("activeBar", false);
					d3.select("#lineB"+selectedYear).classed("activeLine", false);
          d3.select("#lineW"+selectedYear).classed("activeLine", false);
					selectedYear = clickedYear;
					updateYear(clickedYear);
					d3.select("#bar"+clickedYear).classed("highlightedBar", false).classed("activeBar", true);
					d3.select("#lineB"+clickedYear).classed("highlightedLine", false).classed("activeLine", true);
          d3.select("#lineW"+clickedYear).classed("highlightedLine", false).classed("activeLine", true);
				} else { //deselect year
          d3.select("#bar"+selectedYear).classed("activeBar", false);
					d3.select("#lineB"+selectedYear).classed("activeLine", false);
          d3.select("#lineW"+selectedYear).classed("activeLine", false);
					selectedYear = 0;
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

    var min = 0;
		data.forEach(function(d){
			var m = d3.min(d, function(d2){
				return d2.values;
			});
			if(m < min)
				min = m;
		});

		yW = d3.scale.linear().domain([Math.round(min / 10) * 10, Math.round(max / 10) * 10]).range([weerHeight, 0]);

		yAxisW = d3.svg.axis()
				.scale(yW)
				.orient("left")
				.ticks(5);

		svg.append("g")
			.attr("class", "y axis")
			.attr("id", "yaxisW")
			.attr("transform", "translate(0," + (vlindersHeight + margin.top + margin.axis) + ")")
			.call(yAxisW)
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
				.attr("class", "line W activeLine")
				.attr("transform", "translate(0," + (vlindersHeight + margin.top + margin.axis) + ")")
				.attr("id", "lineW" + jaar)
				.attr("d", lineW)
        .on("mouseover", function(){
            var hoveredLine = d3.select(this);
            if (!hoveredLine.classed("activeLine")) {
              var hoveredYear = d3.select(this).attr("id").substring(5);
              d3.select("#bar"+hoveredYear).classed("highlightedBar", true);
              d3.select("#lineB"+hoveredYear).classed("highlightedLine", true);
              d3.select("#lineW"+hoveredYear).classed("highlightedLine", true);
            }
        })
        .on("mouseout", function(){
          var hoveredLine = d3.select(this);
          if (!hoveredLine.classed("activeLine")) {
            d3.selectAll(".highlightedBar").classed("highlightedBar", false);
            d3.selectAll(".highlightedLine").classed("highlightedLine", false);
          }
        })
        .on("click", function(){
          var clickedYear = d3.select(this).attr("id").substring(5);
          if (selectedYear == 0) { // all years are selected
            d3.selectAll(".activeBar").classed("activeBar", false);
            d3.selectAll(".activeLine").classed("activeLine", false);
            selectedYear = clickedYear;
            updateYear(clickedYear);
            d3.select("#bar"+clickedYear).classed("activeBar", true);
            d3.select("#lineB"+clickedYear).classed("activeLine", true);
            d3.select("#lineW"+clickedYear).classed("activeLine", true);
          } else if(selectedYear != clickedYear) { // select a different year
            d3.select("#bar"+selectedYear).classed("activeBar", false);
            d3.select("#lineB"+selectedYear).classed("activeLine", false);
            d3.select("#lineW"+selectedYear).classed("activeLine", false);
            selectedYear = clickedYear;
            updateYear(clickedYear);
            d3.select("#bar"+clickedYear).classed("highlightedBar", false).classed("activeBar", true);
            d3.select("#lineB"+clickedYear).classed("highlightedLine", false).classed("activeLine", true);
            d3.select("#lineW"+clickedYear).classed("highlightedLine", false).classed("activeLine", true);
          } else { //deselect year
            d3.select("#bar"+selectedYear).classed("activeBar", false);
            d3.select("#lineB"+selectedYear).classed("activeLine", false);
            d3.select("#lineW"+selectedYear).classed("activeLine", false);
            selectedYear = 0;
            updateSoort(selectedSoort);
          }
				});
		};
		showButtons(innerSvg);

	};

  var changeWeatherData = function(selectedWeather) {
    $.ajax({
        url: 'http://' + window.location.host + '/data/weer/' + selectedWeather,
        dataType: "json",
        contentType: "application/json",
        success: function(weatherdata) {
            dataW = prepareWeatherData(weatherdata);

            // largest y-value
            var max = 0;
            dataW.forEach(function(d){
              var m = d3.max(d, function(d2){
                return d2.values;
              });
              if(m > max)
                max = m;
            });

            var min = 0;
            dataW.forEach(function(d){
              var m = d3.min(d, function(d2){
                return d2.values;
              });
              if(m < min)
                min = m;
            });

            yW = yW.domain([Math.round(min / 10) * 10, Math.round(max / 10) * 10]);

            yAxisW.scale(yW);
            svg.select("#yaxisW").call(yAxisW);

            for (jaar in dataW) {
              d3.select("#lineW"+jaar)
        				.datum(dataW[jaar])
                .attr("d", lineW);
            }
        }
    });


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
      .attr("class", "button")
			.attr("width", function(d) {
		    	return d.width;
		    })
		    .attr("height", 53)
		    .attr("x", function(d,i) {
		    	return 440 + i*29;
		    })
		    .attr("y",340)
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
          selectedWeather = d.name;
          changeWeatherData(d.name);
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
