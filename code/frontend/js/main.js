import {
    map_main,
    map_draw_trajectory,
    map_draw_start_end,
    map_initialize
} from './map.js';

import {
    vis_draw_legend,
    vis_draw_output
} from './vis.js';

var info_file = '/data/info/0000f77c-6257be58.json';
var action_actual_file = '/data/action_actual/0000f77c-6257be58.json';
var action_predict_file = '/data/action_predict/0000f77c-6257be58.json';

map_initialize('map');
map_main.on('load', function() {

    d3.json(info_file).then(function(trip) {
        d3.json(action_actual_file).then(function(actual) {
            d3.json(action_predict_file).then(function(predict) {

                console.log(trip);
                console.log(actual);
                console.log(predict);

                map_draw_trajectory(trip.gps);
                map_draw_start_end(trip.gps);

                vis_draw_legend('vis-legend-bars', predict);
                vis_draw_output('vis-output', actual, predict);
            });
        });
    });

});