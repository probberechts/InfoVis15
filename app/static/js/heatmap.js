var map;
var heat;
function renderHeatMap() {
  if (map)
    map.remove();
  map = L.map('heatmap').setView([51.1, 4.2], 8);
  var tiles = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {

  }).addTo(map);
  heat = L.heatLayer(new Array()).addTo(map);
}

function updateHeatMap(d) {
  var data_points = new Array();

  for (var key in d) {
      data_points.push([d[key].lat, d[key].lon]);
  }

  heat.setLatLngs(data_points);
};
