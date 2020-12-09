mapboxgl.access_token = 'pk.eyJ1IjoiZGlnaXRhbGtpIiwiYSI6ImNqNXh1MDdibTA4bTMycnAweDBxYXBpYncifQ.daSatfva2eG-95QHWC9Mig';

////////////////////////////////////////////////////////////////////////////////
//  Global Variables
////////////////////////////////////////////////////////////////////////////////
var mapbox_map;

function map_initialize(container_id) {
    mapbox_map = new mapboxgl.Map({
        container: container_id,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40],
        zoom: 9
    });
}