
  var width = 500,
      height = 300;

  var projection = d3.geo.albers()
      .center([8.6, 51])
      .rotate([4.35, 0])
      .parallels([40, 50])
      .scale(1200*11)
      .translate([width / 2, height / 2]);

  var svg = d3.select("#graph_location").append("svg")
          .attr("width", width)
          .attr("height", height);

  var path = d3.geo.path()
      .projection(projection)
      .pointRadius(2);

  var g = svg.append("g");

  g.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

    var data = [];

  function drawLocations(soort) {
      console.log("update locations for " + soort);
      g.selectAll("circle")
          .data(data)
          .exit()
          .remove();

      // load and display the observations
      var filters = [{"name": "soort__naam_nl", "op": "has", "val": soort}];
      $.ajax({
        url: 'http://' + window.location.host + '/data/observaties/',
        data: {"soort": soort},
        dataType: "json",
        contentType: "application/json",
        success: function(response) {
          console.log("fetched data for " + soort)
          data = response;

          g.selectAll("circle")
             .data(data)
             .enter()
             .append("circle")
             .attr("cx", function(d) {
                     return projection([d.lon, d.lat])[0];
             })
             .attr("cy", function(d) {
                     return projection([d.lon, d.lat])[1];
             })
             .attr("r", 0.5)
             .style("fill", "red");
      }});
  }

  d3.json("/static/js/bel.json", function(error, bel) {


    var subunits = topojson.feature(bel, bel.objects.subunits),
        places = topojson.feature(bel, bel.objects.places);

    g.selectAll(".subunit")
        .data(subunits.features)
      .enter().append("path")
        .attr("class", function(d) { return "subunit " + d.id; })
        .attr("d", path);

    g.append("path")
        .datum(topojson.mesh(bel, bel.objects.subunits, function(a, b) { return a !== b }))
        .attr("d", path)
        .attr("class", "subunit-boundary");

    g.append("path")
        .datum(places)
        .attr("d", path)
        .attr("class", "place");

    g.selectAll(".place-label")
        .data(places.features)
      .enter().append("text")
        .attr("class", "place-label")
        .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
        .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; })
        .text(function(d) { return d.properties.name.charAt(0); });
  });

  var zoom = d3.behavior.zoom()
    .on("zoom",function() {
        g.attr("transform","translate("+
            d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        g.selectAll("circle")
            .attr("d", path.projection(projection));
        g.selectAll("path")
            .attr("d", path.projection(projection));

  });

  svg.call(zoom);
