
function updateTimeGraph(soort, minDate, maxDate){
	$.ajax({
        url: 'http://' + window.location.host + '/data/observaties/',
        data: {"soort": soort},
        dataType: "json",
        contentType: "application/json",
        success: function(data) {
		data = d3.nest().key(function(d){return d.datum;}).rollup(function(d){ return d3.sum(d, function(g) {return +g.aantal;});}).entries(data);
		data.forEach(function(d) {
			d.key = d3.time.format("%Y-%m-%d").parse(d.key);
			d.values = +d.values;
		});
		data = data.filter(function(d){return d.key >= minDate && d.key <= maxDate;});
		data.sort(function(a,b){return a.key - b.key;});
		renderTimeLineChart("#monthgraph", data, minDate, maxDate);
	}});
}