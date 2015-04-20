var po = org.polymaps,
  hexI = 15, map, focusMap, data, scale, countMax,
  numClasses = 8,
  xMin, xMax, yMin, yMax,
  cbScheme = "GnBu",
  focusPointLayer, focusHex, focusNonHex, hexLayer,
  mouseOver = true, selectedBin;

function updateBinmap(d)
{
  data = d;
  if (focusMap == undefined)
    create_basemaps();

  var bounds = [2.5,46.8,6,55];

  map.extent(
    [
      { lat : bounds[1], lon : bounds[0] },
      { lat : bounds[3], lon : bounds[2] }
    ]
  ).zoom(7.8);

  focusMap.extent(
    [
      { lat : bounds[1], lon : bounds[0] },
      { lat : bounds[3], lon : bounds[2] }
    ]
  ).zoom(11.6);

  var hexset = generate_hexgrid(data);
  draw_hex_grid(hexset);
};

function create_basemaps()
{
  map = po.map()
    .container( d3.select( "#overviewMap" ).append( "svg:svg" ).node() );

    map.add(po.geoJson()
        .url("/static/js/bel2.json").tile(false).on("load", belTopoLoad));

    hexLayer = d3.select( "#overviewMap svg" ).insert( "svg:g" ).attr( "class", cbScheme );

    focusMap = po.map()
      .container( d3.select( "#focusMap" ).append( "svg:svg" ).node() )
      .add(po.interact())
      .add(po.hash())
      .on("move", function() {
        clear_focusMap_hex();
        update_focusMap_points_by_map();
      });

    focusMap.add(po.image()
      .url(po.url("http://{S}tile.cloudmade.com"
      + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
      + "/998/256/{Z}/{X}/{Y}.png")
      .hosts(["a.", "b.", "c.", ""])));

    var focusHexLayer = d3.select( "#focusMap svg" ).insert( "svg:g" );

    focusNonHex = focusHexLayer.append( "svg:path" )
      .attr( "stroke", "none" )
      .attr( "fill", "white" )
      .attr( "fill-rule", "evenodd" )
      .attr( "fill-opacity", .75 );

    focusHex = focusHexLayer.append( "svg:path" )
      .attr( "class", "hexagon" )
      .attr( "stroke", "none" )
      .attr( "stroke-width", 5 )
      .attr( "fill", "none" );


    focusPointLayer = d3.select( "#focusMap svg" ).insert( "svg:g" );
};

function draw_raw_points()
{
  var layer = d3.select( "#overviewMap svg" ).insert( "svg:g" );

  var marker = layer.selectAll( "circle" )
      .data( data )
    .enter().append( "svg:circle" )
      .attr( "r", 2 )
      .attr( "cx", function(d) { return map.locationPoint( { lon: d.lon, lat: d.lat } ).x; } )
      .attr( "cy", function(d) { return map.locationPoint( { lon: d.lon, lat: d.lat } ).y; } );
};

function generate_hexgrid(data)
{
  var hexset = d3.layout.hexbin()
    .xValue( function(d) { return map.locationPoint( { lon: d.lon, lat: d.lat } ).x; } )
    .yValue( function(d) { return map.locationPoint( { lon: d.lon, lat: d.lat } ).y; } )
    .hexI( hexI )( data );

  countMax = d3.max( hexset, function(d) { return d.data.length; } );

  scale = d3.scale.quantize()
       .domain( [0,countMax] )
       .range( d3.range( numClasses) );

  xMin = d3.min( data, function(d)
     {
       return map.locationPoint( { lon: d.lon, lat: d.lat } ).x;
     }),
  xMax = d3.max( data, function(d)
     {
       return map.locationPoint( { lon: d.lon, lat: d.lat } ).x;
     }),
  yMin = d3.min( data, function(d)
     {
       return map.locationPoint( { lon: d.lon, lat: d.lat } ).y;
     }),
  yMax = d3.max( data, function(d)
     {
       return map.locationPoint( { lon: d.lon, lat: d.lat } ).y;
     });
  return hexset;
};

function draw_hex_grid(hexset)
{

  var hex = hexLayer.selectAll( "polygon" )
      .data( hexset , function(d) { return d; });

  hex.transition().delay(750)
     .attr( "fill-opacity", function(d)
        {
          if ( d.data.length == 0 ) return 0;

          return 1;
        })
      .attr( "points", function(d) { return d.pointString; } );

  var marker = hex
    .enter().append( "svg:polygon" )
      .attr( "stroke", "none" )
      .attr( "fill-opacity", function(d)
         {
           if ( d.data.length == 0 ) return 0;

           return 1;
         })
      .attr( "class", function(d)
         {
           var c = 'q' + ( (numClasses-1) - scale(d.data.length)) + "-" + numClasses;
           return c;
         })
      .attr( "points", function(d) { return d.pointString; } )

      .on( "mouseover", function(d)
      {
        if (mouseOver) {
          d3.select( this ).attr( "stroke", "#f00" ).attr( "stroke-width", 2 );
          on_overviewHex_highlight(d);
        }
      })
      .on( "click", function(d)
      {
        if(! mouseOver)
          selectedBin.attr( "stroke", "none" );
        selectedBin = d3.select( this );
        selectedBin.attr( "stroke", "#f00" ).attr( "stroke-width", 2 );
        mouseOver = !mouseOver;
        focusMap.zoom(12);
        on_overviewHex_highlight(d);

      })
      .on( "mouseout", function(d)
      {
        if (mouseOver) {
          d3.select( this ).attr( "stroke", "none" );
        }
      });

      hex.exit().transition()
      .duration(750)
      .style("fill-opacity", 1e-6)
      .remove();
};

function on_overviewHex_highlight( hex )
{
  // center focus map on this hex
  center_focusMap_on_hex( hex );

  // update focus hex
  update_focusMap_hex( hex );

  // update focus points
  update_focusMap_points_by_hex( hex );

};

function center_focusMap_on_hex( hex )
{
  var center = hex.centre(),
    x = xMin + ( center.x * hexI - .5 * hexI ),
    y = yMax - ( center.y * hexI - .5 * hexI );

  var llCenter = map.pointLocation( { x : x, y : y } );

  focusMap.center(llCenter);
};

function update_focusMap_hex( hex )
{
  var pathString = generate_pathString_from_points( hex.points );

  var extString = "M 0 0 L " + focusMap.size().x + " 0 " + focusMap.size().x + " " + focusMap.size().y + " 0 " + focusMap.size().y + " 0 0 Z";

  focusNonHex.attr( 'd', extString + ' ' + pathString );
  focusHex.attr( 'd', pathString );
};

function clear_focusMap_hex( )
{
  focusNonHex.attr( 'd', ' ' );
  focusHex.attr( 'd', ' ' );
};

function generate_pointString_from_points( points )
{
  var i = 0, pt = points[i], pt_ll = map.pointLocation( pt ), pt_focus = focusMap.locationPoint( pt_ll );

  var pointString = pt_focus.x + ',' + pt_focus.y;

  while ( ++i < points.length )
  {
    pt = points[i],
    pt_ll = map.pointLocation( pt ),
    pt_focus = focusMap.locationPoint( pt_ll );

    pointString += " " + pt_focus.x + ',' + pt_focus.y;
  }

  return pointString;
};

function generate_pathString_from_points( points )
{
  var i = 0, pt = points[i], pt_ll = map.pointLocation( pt ), pt_focus = focusMap.locationPoint( pt_ll );

  var pathString = "M " + pt_focus.x + " " + pt_focus.y + " L";

  while ( ++i < points.length )
  {
    pt = points[i],
    pt_ll = map.pointLocation( pt ),
    pt_focus = focusMap.locationPoint( pt_ll );

    pathString += " " + pt_focus.x + ' ' + pt_focus.y;
  }

  return pathString;
};


function update_focusMap_points_by_hex( hex )
{
  // select
  var circles = focusPointLayer.selectAll( "circle" )
    .data( hex.data );

  // enter
  circles.enter().append( "svg:circle" )
    .attr( "r", 2 )
    .attr( "cx", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    })
    .attr( "cy", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });


  // update
  circles
    .attr( "cx", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    })
    .attr( "cy", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });

  // exit
  circles.exit()
    .remove();
}

function update_focusMap_points_by_map(  )
{
  // select
  var circles = focusPointLayer.selectAll( "circle" )
    .data( data );

  // enter
  circles.enter().append( "svg:circle" )
    .attr( "r", 2
    )
    .attr( "cx", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    })
    .attr( "cy", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });


  // update
  circles
    .attr( "cx", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).x;
    })
    .attr( "cy", function(d)
    {
      return focusMap.locationPoint( { lon: d.lon, lat: d.lat } ).y;
    });

  // exit
  circles.exit()
    .remove();
}

function belTopoLoad(e) {
  for (var i = 0; i < e.features.length; i++) {
    var feature = e.features[i];
    feature.element.setAttribute("class", "bel");
  }
}
