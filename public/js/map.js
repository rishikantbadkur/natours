/* eslint-disable */
export const displayMap = function (locations) {
  var map = L.map('map', { zoomControl: false });

  L.tileLayer(
    'https://api.maptiler.com/maps/voyager-v2/{z}/{x}/{y}.png?key=GQtYWwp1oHR2gyxrnEF8',
    {
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    }
  ).addTo(map);

  // Custom icon defination
  const icon = L.icon({
    iconUrl: '/img/pin.png',
    iconSize: [32, 40],
    iconAnchor: [19, 42],
    popupAnchor: [0, -25],
  });

  const points = [];

  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);

    L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: icon,
    })
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`);

    var popupLocation = new L.LatLng(loc.coordinates[1], loc.coordinates[0]);

    var popupContent = `<p>Day ${loc.day}: ${loc.description}</p>`,
      popup1 = new L.Popup({
        offset: [0, -25],
      });

    popup1.setLatLng(popupLocation);
    popup1.setContent(popupContent);

    map.addLayer(popup1);
  });

  const bounds = L.latLngBounds(points);

  map.fitBounds(bounds, {
    padding: [80, 80],
  });

  map.scrollWheelZoom.disable();
};
