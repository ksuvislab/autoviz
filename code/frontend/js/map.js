export var map_main = undefined;

var access_token = 'pk.eyJ1IjoiZGlnaXRhbGtpIiwiYSI6ImNqNXh1MDdibTA4bTMycnAweDBxYXBpYncifQ.daSatfva2eG-95QHWC9Mig';



export function map_initialize(container_id) {
    mapboxgl.accessToken = access_token;
    map_main = new mapboxgl.Map({
        container: container_id,
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-74.5, 40],
        zoom: 9
    });
}

export function map_draw_trajectory(gps_data) {

    let trajectory  = [];

    for (let i = 0; i < gps_data.length; ++i) {
        let lat = gps_data[i].latitude;
        let lng = gps_data[i].longitude;
        trajectory.push([lng, lat]);
    }

    let line_string = turf.lineString(trajectory);
    map_main.addSource('trip-trajectory', {
        type: 'geojson',
        data: line_string
    });

    let trajectory_layer = {
        id: 'trip-trajectory',
        type: 'line',
        source: 'trip-trajectory',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#fff',
            'line-width': 4,
            'line-opacity': 0.5
        }
    }

    map_main.addLayer(trajectory_layer);
    map_focus(line_string);
}

export function map_draw_start_end(gps_data)
{
    let start = turf.point([gps_data[0].longitude, gps_data[0].latitude]);
    let end = turf.point([gps_data[gps_data.length - 1].longitude, gps_data[gps_data.length - 1].latitude]);

    map_main.addSource('trip-start', {
        type: 'geojson',
        data: start
    });

    map_main.addSource('trip-end', {
        type: 'geojson',
        data: end
    });

    // Create starting point
    let start_point_layer = {
        id: 'trip-start',
        type: 'circle',
        source: 'trip-start',
        paint: {
            'circle-radius': 8,
            'circle-color': '#a3be8c',
            'circle-opacity': 0.8
        }
    }
    // Create ending point
    let end_point_layer = {
        id: 'trip-end',
        type: 'circle',
        source: 'trip-end',
        paint: {
            'circle-radius': 8,
            'circle-color': '#bf616a',
            'circle-opacity': 0.8
        }
    }

    map_main.addLayer(start_point_layer);
    map_main.addLayer(end_point_layer);
}

function map_focus(coords)
{
    let coordinates = coords.geometry.coordinates;
    let bounds = coordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[1]));

    return map_main.fitBounds(bounds, { padding: 40, duration: 0, zoom: 18});
}

export function map_draw_locations(locations, data_type) {

    let points = [];
    for (let i = 0; i < locations.length; ++i) {
        if (locations[i].data.location) {
            let location = locations[i].data.location;
            points.push([location.longitude, location.latitude]);
        }
    }

    let turf_points = turf.points(points);

    if (map_main.getSource('points-' + data_type)) {
        map_main.getSource('points-' + data_type).setData(turf_points);
        return;
    }

    map_main.addSource('points-' + data_type, {
        type: 'geojson',
        data: turf_points
    });

    let point_layer = {
        id: 'points-' + data_type,
        type: 'circle',
        source: 'points-' + data_type,
        paint: {
            'circle-radius': 8,
            'circle-color': (data_type === 'predict') ? 'aqua' : '#07ef2c',
            'circle-opacity': 0.8
        }
    }

    return  map_main.addLayer(point_layer);
}