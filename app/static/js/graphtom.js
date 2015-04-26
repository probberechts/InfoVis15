Date.prototype.getWeekNumber = function(){
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};//source=http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php

function updateTimeGraph(soort, minDate, maxDate){
	$.ajax({
        url: 'http://' + window.location.host + '/data/observaties/',
        data: {"soort": soort},
        dataType: "json",
        contentType: "application/json",
        success: function(data) {
		data.forEach(function(d){
			d.weekyr = d.datum.getWeekNumber()+""+d.datum.getFullYear();
			console.log(d.weekyr);
		});
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