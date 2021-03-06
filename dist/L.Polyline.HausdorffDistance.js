(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
(function (global){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null);

if (L.Polyline === undefined) {
  throw new Error('Cannot find L.Polyline');
}

function getLatLngsFlatten(polyline) {
  var latlngs = polyline.getLatLngs();

  if (latlngs.length > 0 && Array.isArray(latlngs[0])) {
    var result = [];

    for (var j = 0; j < latlngs.length; j += 1) {
      result = result.concat(latlngs[j]);
    }

    return result;
  }

  return latlngs;
}

if (typeof Math.radians === 'undefined') {
  // Converts from degrees to radians.
  Math.radians = function radians(degrees) {
    return degrees * Math.PI / 180;
  };
}

if (typeof Math.degrees === 'undefined') {
  // Converts from radians to degrees.
  Math.degrees = function degrees(radians) {
    return radians * 180 / Math.PI;
  };
} // from https://gis.stackexchange.com/questions/157693/getting-all-vertex-lat-long-coordinates-every-1-meter-between-two-known-points


function getDestinationAlong(from, azimuth, distance) {
  var R = 6378137; // Radius of the Earth in m

  var brng = Math.radians(azimuth); // Bearing is degrees converted to radians.

  var lat1 = Math.radians(from.lat); // Current dd lat point converted to radians

  var lon1 = Math.radians(from.lng); // Current dd long point converted to radians

  var lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / R) + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng));
  var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1), Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)); // convert back to degrees

  lat2 = Math.degrees(lat2);
  lon2 = Math.degrees(lon2);
  return L.latLng(lat2, lon2);
}

function bearingTo(start, end) {
  var startLat = Math.radians(start.lat);
  var startLong = Math.radians(start.lng);
  var endLat = Math.radians(end.lat);
  var endLong = Math.radians(end.lng);
  var dPhi = Math.log(Math.tan(endLat / 2.0 + Math.PI / 4.0) / Math.tan(startLat / 2.0 + Math.PI / 4.0));
  var dLong = endLong - startLong;

  if (Math.abs(dLong) > Math.PI) {
    if (dLong > 0.0) {
      dLong = -(2.0 * Math.PI - dLong);
    } else {
      dLong = 2.0 * Math.PI + dLong;
    }
  }

  return (Math.degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

function routeBetween(from, to, interval) {
  var d = from.distanceTo(to);
  var azimuth = bearingTo(from, to);
  var latlngs = [from];

  for (var counter = interval; counter < d; counter += interval) {
    latlngs.push(getDestinationAlong(from, azimuth, counter));
  }

  latlngs.push(to);
  return latlngs;
}

function resample(latlngs, interval) {
  var newLatLngs = [];
  var size = latlngs.length;

  for (var i = 1; i < size; i += 1) {
    newLatLngs.push.apply(newLatLngs, _toConsumableArray(routeBetween(latlngs[i - 1], latlngs[i], interval)));
  }

  return newLatLngs;
}

L.Polyline.include({
  furthestFrom: function furthestFrom(o) {
    var resampling = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var xLatLng = getLatLngsFlatten(this);
    var yLatLng = getLatLngsFlatten(o);

    if (resampling !== null && resampling > 0) {
      xLatLng = resample(xLatLng, resampling);
      yLatLng = resample(yLatLng, resampling);
    }

    var distances = {};
    var sizeX = xLatLng.length;
    var sizeY = yLatLng.length;
    var supX = Number.MIN_VALUE;
    var supXLatLngs;
    var supY = Number.MIN_VALUE;
    var supYLatLngs;

    for (var x = 0; x < sizeX; x += 1) {
      var infY = Number.MAX_VALUE;
      var infYLatLngs = void 0;

      for (var y = 0; y < sizeY; y += 1) {
        var key = "".concat(x, "/").concat(y);
        distances[key] = xLatLng[x].distanceTo(yLatLng[y]);

        if (distances[key] < infY) {
          infY = distances[key];
          infYLatLngs = [xLatLng[x], yLatLng[y]];
        }
      }

      if (infY > supX) {
        supX = infY;
        supXLatLngs = infYLatLngs;
      }
    }

    for (var _y = 0; _y < sizeY; _y += 1) {
      var infX = Number.MAX_VALUE;
      var infXLatLngs = void 0;

      for (var _x = 0; _x < sizeX; _x += 1) {
        var _key = "".concat(_x, "/").concat(_y);

        if (distances[_key] < infX) {
          infX = distances[_key];
          infXLatLngs = [xLatLng[_x], yLatLng[_y]];
        }
      }

      if (infX > supY) {
        supY = infX;
        supYLatLngs = infXLatLngs;
      }
    }

    return supX > supY ? supXLatLngs : supYLatLngs;
  },
  distanceTo: function distanceTo(o) {
    var resampling = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;

    var _this$furthestFrom = this.furthestFrom(o, resampling),
        _this$furthestFrom2 = _slicedToArray(_this$furthestFrom, 2),
        point1 = _this$furthestFrom2[0],
        point2 = _this$furthestFrom2[1];

    return point1.distanceTo(point2);
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
