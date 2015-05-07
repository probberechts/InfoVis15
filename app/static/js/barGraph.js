var selectedYear = 0;//now global because used in other graphs

var barGraph = (function() {

	var barGraph = {};

	// configuration
	var startYear = 2008, endYear = 2014;
	var margin = {top: 20, right: 20, bottom: 70, left: 41},
		w = 600 - margin.left - margin.right,
		h = 300 - margin.top - margin.bottom,
		barPadding = 1;

	// local variables
	var svg;


	barGraph.create = function() {
		d3.select("#bargraph-container").remove();
		svg = d3.select("#timeline")
			.append("div")
			.classed("svg-container", true)
			.attr("id", "bargraph-container")
			.append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", "0 0 600 300")
			.classed("svg-content-responsive", true)
			.attr("id", "timelinegraph")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	};


	barGraph.update = function( data ) {
	  yearlyOcc = prepareData(data);

		barGraph.create();

		var x = d3.scale.ordinal()
			.domain(yearlyOcc.map(function(d) {
				return d.year;
			}))
			.rangeRoundBands([0,w], 0.3, 0.1);

		var y = d3.scale.linear()
			.domain([0, d3.max(yearlyOcc, function(d) { return d.amounts; })])
			.range([h, 0]);

		var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

		var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(10);

		svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + h + ")")
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", "-.8em")
				.attr("dy", "-.55em")
				.attr("transform", "translate(20,12)" );

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
				.data(yearlyOcc)
				.enter().append("rect")
				.attr("class", "bar activeBar")
				.attr("id", function(d){return "bar"+d.year;})
				.attr("x", function(d) { return x(d.year);})
				.attr("width", x.rangeBand())
				.attr("y", function(d) { return y(d.amounts); })
				.attr("height", function(d) { return h - y(d.amounts); })
				.on("mouseover", function(){
						var hoveredBar = d3.select(this);
						if (!hoveredBar.classed("activeBar")) {
							var hoveredYear = d3.select(this).attr("id").substring(3);
							d3.select("#bar"+hoveredYear).classed("highlightedBar", true);
							d3.select("#lineB"+hoveredYear).classed("highlightedLine", true);
							d3.select("#lineW"+hoveredYear).classed("highlightedLine", true);
						}
				})
				.on("mouseout", function(){
					var hoveredBar = d3.select(this);
					if (!hoveredBar.classed("activeBar")) {
						d3.selectAll(".highlightedBar").classed("highlightedBar", false);
						d3.selectAll(".highlightedLine").classed("highlightedLine", false);
					}
				})
				.on("click", function(d) {
					var clickedYear = d.year;
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


	var parseYear = function( date ) {
		return d3.time.format("%Y-%m-%d").parse(date).getFullYear();
	};


	var prepareData = function( rawData ) {
		// group amount of butterflies observed each year
		var transformedData = d3.nest()
					.key(function(d) {
						return parseYear(d.datum);
					}).rollup(function(d) {
					   return d3.sum(d, function(g) {return g.aantal; });
					}).entries(rawData);

		// rename keys and add missing years
		var data = [];
		var j = 0;
		for (var i = startYear; i <= endYear; i++) {
			while(j < transformedData.length && transformedData[j].key < startYear)
				j++;
			if (j < transformedData.length && parseInt(transformedData[j].key) == i) {
				data.push({
					"year" : i,
					"amounts" : transformedData[j].values
				});
				j++;
			} else {
				data.push({
					"year" : i,
					"amounts" : 0
				});
			}
		}

		return data;
	};


 	return barGraph;

})();
