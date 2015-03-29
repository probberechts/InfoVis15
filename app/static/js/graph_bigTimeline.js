function renderTimeline(soort) {
  console.log("timeline for " + soort);

  // load and display the observations
  var filters = [{"name": "soort__naam_nl", "op": "has", "val": soort}];
  $.ajax({
    url: 'http://' + window.location.host + '/data/observaties/',
    data: {"soort": soort},
    dataType: "json",
    contentType: "application/json",
    success: function(response) {
      console.log("fetched data for " + soort + " barchart");
      data = response;

      var allYears = [];
      var today = new Date();
      var currentYear = today.getFullYear();
      var parseDate = d3.time.format("%Y-%m-%d").parse;
      
      data.forEach(function(d) {
        var tempYear = parseDate(d.datum).getFullYear();
        if(tempYear >= 2005 && tempYear <= currentYear) {
          allYears.push(tempYear);
        }
      });

      var yearlyOccTemp = allYears.reduce(function (acc, curr) {
        if (typeof acc[curr] == 'undefined') {
          acc[curr] = 1;
        } else {
          acc[curr] += 1;
        }

        return acc;
      }, {});

      /*console.log(yearlyOccTemp);
      for( var i in  yearlyOccTemp ){
        console.log( i + ' occured ' + yearlyOccTemp[i] + ' times ' ); 
      }*/

      var yearlyOcc = [];
      for( var i in  yearlyOccTemp ){
        yearlyOcc.push([new Date(i, 0, 1), yearlyOccTemp[i]]);
        //yearlyOcc.push([i, yearlyOccTemp[i]]);
      }
      //console.log(yearlyOcc);


      var margin = {top: 20, right: 20, bottom: 70, left: 60};
      var w = 600 - margin.left - margin.right;
      var h = 300 - margin.top - margin.bottom;
      var barPadding = 1;

      d3.select("#timelinegraph").remove();
      var svg = d3.select("#timeline").append("svg")
        .attr("id", "timelinegraph")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var x = d3.time.scale().range([0, w]);
      var y = d3.scale.linear().range([h, 0]);

      x.domain([new Date(2005, 0, 1), new Date()]);
      //x.domain([2005, currentYear]);
      y.domain([0, d3.max(yearlyOcc, function(d) { return d[1]; })]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left")
          .ticks(10);

      //brush no used anymore
      /*var brush = d3.svg.brush()
        .x(x)
        .on("brush", brushed);*/

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + h + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", "-.55em")
          .attr("transform", "rotate(-90)" );

      svg.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + -20 + ",0)")
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
          .style("fill", "steelblue")
          .attr("x", function(d) { return x(d[0]) - (w/yearlyOcc.length - 15)/2; })
          .attr("width", w/yearlyOcc.length - 15)
          .attr("y", function(d) { return y(d[1]); })
          .attr("height", function(d) { return h - y(d[1]); })
          .on("click", function(d) {
            var nextyear = new Date(d[0].getFullYear() + 1, d[0].getMonth(), d[0].getDay());
            updateTimeGraph(soort, d[0], nextyear);
          });

      //brush not used anymore
      /*svg.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", h + 7);*/

      /*function brushed() {
        //http://bl.ocks.org/mbostock/1667367
        //send selected dates to Tom's graph
        var selectedDates = brush.extent();
        updateTimeGraph(soort, selectedDates[0], selectedDates[1]);        
      }*/

    }
  });
}

