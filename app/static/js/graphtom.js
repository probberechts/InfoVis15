
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
		
		data.sort(function(a,b){return a.key - b.key;});
		data.forEach(function(d) {
			if(d.key > new Date())//filter out impossible dates, TODO remove these from the DB
				d.key = null;
		});
		renderTimeLineChart("#monthgraph", data, minDate, maxDate);
	}});
}