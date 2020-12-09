import {
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
    map_container.style.width = '400px';
    map_container.style.height = '300px';
    document.body.appendChild(map_container);
    map_initialize('map');
    return;
}