var map;

var stops = [];
function cacheStops() {
  stops = [];
  var stopEls = document.querySelectorAll('.story-stop');
  stopEls.forEach(function(stop) {
    stops.push({
      el: stop,
      center: ol.proj.fromLonLat(stop.getAttribute('data-center').split(',').map(parseFloat)),
      resolution: parseFloat(stop.getAttribute('data-resolution')),
      feature: stop.getAttribute('data-feature')
    });
  });
}

var closestBefore = null;
var closestBeforeDistance = -Infinity;
var closestAfter = null;
var closestAfterDistance = Infinity;
var t;
function update() {
  var storyPos = document.body.scrollTop;
  closestBefore = null;
  closestBeforeDistance = -Infinity;
  closestAfter = null;
  closestAfterDistance = Infinity;
  stops.forEach(function(stop) {
    var stopDistance = stop.el.offsetTop - storyPos;
    if (stopDistance <= 0 && closestBeforeDistance < stopDistance) {
      closestBefore = stop;
      closestBeforeDistance = stopDistance;
    }
    if (stopDistance >= 0 && closestAfterDistance > stopDistance) {
      closestAfter = stop;
      closestAfterDistance = stopDistance;
    }
  });
  if (!closestBefore) {
    closestBefore = closestAfter;
  } else if (!closestAfter) {
    closestAfter = closestBefore;
  }
  t = (-closestBeforeDistance) / (closestAfterDistance - closestBeforeDistance);
  if (isNaN(t)) t = 0;
  t = Math.min(1, Math.max(0, t));
  t = Math.pow(t, 3);
  var interpolated = [
    closestBefore.center[0] * (1 - t) + closestAfter.center[0] * t,
    closestBefore.center[1] * (1 - t) + closestAfter.center[1] * t
  ];
  map.getView().setCenter(interpolated);

  var unscaleFactor = 1 / (1 + 0.2 * Math.abs(2 * t - 1));
  var resolution = unscaleFactor * (closestBefore.resolution * (1 - t) + closestAfter.resolution * t);
  map.getView().setResolution(resolution);
}

function updateColor(color, sat) {
  color = color.substr(5).split(',').map(parseFloat);
  var gray = color[0] * 0.3086 + color[1] * 0.6094 + color[2] * 0.0820;

  color[0] = Math.round(color[0] * sat + gray * (1 - sat));
  color[1] = Math.round(color[1] * sat + gray * (1 - sat));
  color[2] = Math.round(color[2] * sat + gray * (1 - sat));

  return 'rgba(' + color.join(',') + ')';
}

function init() {
  var vectorSource = new ol.source.Vector({
    features: (new ol.format.GeoJSON({
      featureProjection: 'EPSG:3857'
    })).readFeatures(
      {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-0.0876296422109829,51.50679721493759],[-0.08473485275925793,51.506298257736404],[-0.08181779569636584,51.50591017613576],[-0.07968010502432278,51.505231025381164],[-0.07422454028837956,51.50387269350418],[-0.07149883204847893,51.502766830971666],[-0.07475896295639034,51.5010450156438],[-0.07841085118779724,51.500060831699244],[-0.08235221836437662,51.50032420695027],[-0.08589276853994793,51.50137769273417],[-0.08845354382416618,51.50287470958827],[-0.08927744543734943,51.504787492893854],[-0.0876296422109829,51.50679721493759]]]},"properties":{"Name":"Horsey Downe","color":"rgba(255,60,60,0.65)","id":"horseydowne"}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-0.06700219106156603,51.50446323145647],[-0.06315892332372741,51.50366945282656],[-0.05744425896262732,51.503091788142],[-0.04691853101547288,51.50906570336866],[-0.04718680267512362,51.50965475705391],[-0.0517950325324358,51.50959739536211],[-0.0584078423776788,51.50853619103731],[-0.06303911338427755,51.50710209186812],[-0.06727868485300477,51.5050512516288],[-0.06700219106156603,51.50446323145647]]]},"properties":{"Name":"Wapping","color":"rgba(60,255,128,0.65)","id":"wapping"}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-0.03630281665124377,51.506832414710345],[-0.0395140999626988,51.507403256437925],[-0.043203575409066074,51.507313472251326],[-0.0448826877464675,51.50622726920932],[-0.04598866291222243,51.50516598638745],[-0.04773979025800106,51.504750071512916],[-0.04939875300663345,51.5037030965747],[-0.04806170957457299,51.5028463139835],[-0.04506701694075999,51.50439152116027],[-0.042099454007814514,51.50559538628306],[-0.039629305709131604,51.50553887235779],[-0.03696528949199471,51.50511431060278],[-0.03630281665124377,51.506832414710345]]]},"properties":{"Name":"Bermondsey","color":"rgba(60,128,255,0.65)","id":"bermondsey"}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-0.07473063760335955,51.506709469849426],[-0.07448416025755987,51.507196157293436],[-0.07354074696846458,51.50722789759837],[-0.07247834461587979,51.507196157293436],[-0.07159442585852925,51.506815271909886],[-0.07133944929390891,51.50651902552141],[-0.07205338367484587,51.506074652327214],[-0.07337076259205101,51.506413222773006],[-0.07473063760335955,51.506709469849426]]]},"properties":{"Name":"St Catherine's Dock","id":"stcatherinesdock"}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-0.07452362598356042,51.506776302549895],[-0.07452362598356042,51.506776302549895]]]},"properties":{"Name":""}}],"basemap":"http://wmts.maptiler.com/aHR0cHM6Ly9tYXBoYWNrYXRob24uZ2l0aHViLmlvL2RhdGEtc2V0cy9tb3JnYW4vbWV0YWRhdGEuanNvbg/json"}
    )
  });

  var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: function(f) {
      console.log(f, f.get('color'));
      var saturate = 0;
      if (f.get('id') == closestBefore.feature) {
        saturate = Math.max(saturate, 1 - t);
      }
      if (f.get('id') == closestAfter.feature) {
        saturate = Math.max(saturate, t);
      }
      saturate = Math.pow(saturate, 1.5);
      return new ol.style.Style({
        fill: new ol.style.Fill({
          color: updateColor(0 * f.get('color') || 'rgba(60,128,255,0.65)', .2 + saturate * .8)
        })
      })
    }
  });
  vectorLayer.on('precompose', function(evt) {
    evt.context.filter = 'blur(15px)';
  });
  vectorLayer.on('postcompose', function(evt) {
    evt.context.filter = 'none';
  });

  loadMapTilerTileJSON('https://wmts.maptiler.com/aHR0cHM6Ly9tYXBoYWNrYXRob24uZ2l0aHViLmlvL2RhdGEtc2V0cy9tb3JnYW4vbWV0YWRhdGEuanNvbg/json', function(source, bounds, extent) {
    map = new ol.Map({
      layers: [
        new ol.layer.Tile({
          opacity: 0.2,
          source: new ol.source.OSM()
        }),
        new ol.layer.Tile({
          source: source,
          extent: extent
        }),
        vectorLayer
      ],
      controls: [],
      target: 'map',
      view: new ol.View({
        center: [0, 0],
        zoom: 2,
        projection: source.getProjection()
      })
    });

    cacheStops();
    update();

    window.onscroll = function() {
      update();
    };
  });
}
