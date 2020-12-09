import {
    map_main,
    map_initialize
} from './map.js';

////////////////////////////////////////////////////////////////////////////////
// Initialize
////////////////////////////////////////////////////////////////////////////////
draw_map();

// Testing
console.log(d3);
console.log($);
console.log(jQuery);

function draw_map() {
    let map_container = document.createElement('div');
    map_container.setAttribute('id', 'map');
    document.body.appendChild(map_container);
    // Create map
    map_initialize('map');
    console.log(map_main);
    return;
}