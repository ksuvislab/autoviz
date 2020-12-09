////////////////////////////////////////////////////////////////////////////////
//  Global Variables
////////////////////////////////////////////////////////////////////////////////
export var map_main = undefined;

//
var access_token = 'pk.eyJ1IjoiZGlnaXRhbGtpIiwiYSI6ImNqNXh1MDdibTA4bTMycnAweDBxYXBpYncifQ.daSatfva2eG-95QHWC9Mig';

export function map_initialize(container_id) {
    mapboxgl.accessToken = access_token;
    map_main = new mapboxgl.Map({
        container: container_id,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.5, 40],
        zoom: 9
    });
}