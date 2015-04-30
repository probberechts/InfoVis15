var binMap = (function () {

  var binMap = {};

  // configuration
  var hexI = 15,
      numClasses = 8,
      cbScheme = "Greens",
	  bounds = [2.5,46.8,6,55];

  // local variables
  var po = org.polymaps,
    overviewMap, focusMap, originalData, data, scale, countMax,
    xMin, xMax, yMin, yMax,
    focusPointLayer, focusHex, focusNonHex, hexLayer,
    mouseOver = true, selectedBin;

  binMap.create = function() {
    overviewMap = po.map()
      .container( 
		d3.select( "#overviewMap" )
			.append("div")
			.classed("svg-container-map", true)
			.append( "svg:svg" )
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", "0 0 600 300")
			.classed("svg-content-responsive", true)
			.node() 
		);

    overviewMap.add(po.geoJson()
      .url("/static/js/bel2.json").tile(false).on("load", belTopoLoad));

	overviewMap.extent(
      [
        { lat : bounds[1], lon : bounds[0] },
        { lat : bounds[3], lon : bounds[2] }
      ]
    ).zoom(7.8);

    hexLayer = d3.select( "#overviewMap svg" ).insert( "svg:g" ).attr( "class", cbScheme );

    focusMap = po.map()
      .container( 
		d3.select( "#focusMap" )
			.append("div")
			.classed("svg-container-map", true)
			.append( "svg:svg" )
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", "0 0 600 300")
			.classed("svg-content-responsive", true)
			.node()
		)
      .add(po.interact())
      .add(po.hash())
      .on("move", function() {
        clear_focusMap_hex();
        update_focusMap_points_by_map();
      });

    focusMap.add(po.image()
      .url(po.url("http://{S}tile.cloudmade.com"  
                  + "/1a1b06b230af4efdbb989ea99e9841af"  // http://cloudmade.com/register 
                  + "/998/256/{Z}/{X}/{Y}.png")
      .hosts(["a.", "b.", "c.", ""])));

	var focusHexLayer = d3.select( "#focusMap svg" ).insert( "svg:g" );

    focusNonHex = focusHexLayer.append( "svg:path" )
      .attr( "stroke", "none" )
      .attr( "fill", "white" )
      .attr( "fill-rule", "evenodd" )
      .attr( "fill-opacity", 0.75 );

    focusHex = focusHexLayer.append( "svg:path" )
      .attr( "class", "hexagon" )
      .attr( "stroke", "none" )
      .attr( "stroke-width", 5 )
      .attr( "fill", "none" );

    focusPointLayer = d3.select( "#focusMap svg" ).insert( "svg:g" );

	focusMap.extent(
      [
        { lat : bounds[1], lon : bounds[0] },
        { lat : bounds[3], lon : bounds[2] }
      ]
    ).zoom(7.8);
  };

  binMap.updateData = function( d ) {
    originalData = d;
	update(d);
  };

  binMap.filterData = function( minDate, maxDate ) {
	var filteredData = originalData.filter(function(d){return d3.time.format("%Y-%m-%d").parse(d.datum) >= minDate && d3.time.format("%Y-%m-%d").parse(d.datum) <= maxDate;});
	update(filteredData);
  };

  var update = function( d ) {
    data = d;
	
    if (focusMap === undefined)
      binMap.create();

	var hexset = generate_hexgrid(data);
    draw_hexgrid(hexset);

	update_focusMap_points_by_map();

  };

  var resetZoom = function() {
    focusMap.extent(
      [
        { lat : bounds[1], lon : bounds[0] },
        { lat : bounds[3], lon : bounds[2] }
      ]
    ).zoom(11.6);
  };

  var generate_hexgrid = function(data) {
    var hexset = d3.layout.hexbin()
      .xValue( function(d) { return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).x; } )
      .yValue( function(d) { return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).y; } )
      .hexI( hexI )( data );

    countMax = d3.max( hexset, function(d) { return d.data.length; } );

    scale = d3.scale.quantize()
      .domain( [0,countMax] )
      .range( d3.range( numClasses ) );

    xMin = d3.min( data, function(d) {
      return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    });
    xMax = d3.max( data, function(d) {
      return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    });
    yMin = d3.min( data, function(d) {
      return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });
    yMax = d3.max( data, function(d) {
      return overviewMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });

    return hexset;
  };

  var draw_hexgrid = function(hexset) {

    var hex = hexLayer.selectAll( "polygon" )
      .data( hexset , function(d) { return d; });

        // enter
    var marker = hex .enter().append( "svg:polygon" )
      .attr( "stroke", "none" )
      .attr( "fill-opacity", function(d) {
           if ( d.data.length === 0 ) return 0;

           return 1;
      })
      .attr( "class", function(d) {
           var c = 'q' + ( (numClasses-1) - scale(d.data.length)) + "-" + numClasses;
           return c;
      })
      .attr( "points", function(d) { return d.pointString; } )

      .on( "mouseover", function(d) {
        if (mouseOver) {
          d3.select( this ).attr( "stroke", "#f00" ).attr( "stroke-width", 2 );
          on_overviewHex_highlight(d);
        }
      })
      .on( "click", function(d) {
        if(! mouseOver)
          selectedBin.attr( "stroke", "none" );
        selectedBin = d3.select( this );
        selectedBin.attr( "stroke", "#f00" ).attr( "stroke-width", 2 );
        mouseOver = !mouseOver;
        on_overviewHex_highlight(d);
      })
      .on( "mouseout", function(d) {
        if (mouseOver) {
          d3.select( this ).attr( "stroke", "none" );
        }
      });

      // update
      hex.transition().delay(750)
        .attr( "fill-opacity", function(d) {
          if ( d.data.length === 0 ) return 0;

            return 1;
        })
        .attr( "points", function(d) { 
          return d.pointString; 
        });

        // exit
      hex.exit().transition()
        .duration(750)
        .style("fill-opacity", 1e-6)
        .remove();
  };

  var on_overviewHex_highlight = function( hex ) {
	// reset zoom
	resetZoom();

    // center focus map on this hex
    center_focusMap_on_hex( hex );

    // update focus hex
    update_focusMap_hex( hex );

    // update focus points
    //update_focusMap_points_by_hex( hex );
  };

  var center_focusMap_on_hex = function( hex ) {
    var center = hex.centre(), 
		x = xMin + ( center.x * hexI - 0.5 * hexI ), 
		y = yMax - ( center.y * hexI - 0.5 * hexI );

    var llCenter = overviewMap.pointLocation( { x : x, y : y } );

    focusMap.center(llCenter);
  };

  var update_focusMap_hex = function ( hex ) {
    var pathString = generate_pathString_from_points( hex.points );

    var extString = "M 0 0 L " + focusMap.size().x + " 0 " + focusMap.size().x + " " + focusMap.size().y + " 0 " + focusMap.size().y + " 0 0 Z";

    focusNonHex.attr( 'd', extString + ' ' + pathString );
    focusHex.attr( 'd', pathString );
  };

  var clear_focusMap_hex = function( ) {
    focusNonHex.attr( 'd', ' ' );
    focusHex.attr( 'd', ' ' );
  };

  var generate_pathString_from_points = function( points ) {
    var i = 0, 
		pt = points[i], 
		pt_ll = overviewMap.pointLocation( pt ),
		pt_focus = focusMap.locationPoint( pt_ll );

    var pathString = "M " + pt_focus.x + " " + pt_focus.y + " L";

    while ( ++i < points.length ) {
      pt = points[i];
      pt_ll = overviewMap.pointLocation( pt );
      pt_focus = focusMap.locationPoint( pt_ll );

      pathString += " " + pt_focus.x + ' ' + pt_focus.y;
    }

    return pathString;
  };


  var update_focusMap_points_by_hex = function( hex ) {
    // select
    var circles = focusPointLayer.selectAll( "circle" )
      .data( hex.data );

    // enter
    circles.enter().append( "svg:circle" )
      .attr( "r", 2 )
      .attr( "cx", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
      })
      .attr( "cy", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
      });

    // update
    circles
      .attr( "cx", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
      })
      .attr( "cy", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
      });

    // exit
    circles
      .exit()
      .remove();
  };

  var update_focusMap_points_by_map = function(  ) {
    // select
    var circles = focusPointLayer.selectAll( "circle" )
      .data( data );

    // enter
    circles.enter().append( "svg:circle" )
      .attr( "r", 2)
      .attr( "cx", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
      })
      .attr( "cy", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
      });

    // update
    circles
      .attr( "cx", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
      })
      .attr( "cy", function(d) {
        return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
      });

    // exit
    circles.exit()
      .remove();
  };

  var belTopoLoad = function(geoData) {
    for (var i = 0; i < geoData.features.length; i++) {
      geoData.features[i].element.setAttribute("class", "bel");
    }
  };

  return binMap;

})();
