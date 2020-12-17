import {
    map_main,
    map_draw_trajectory,
    map_draw_start_end,
    map_initialize
} from './map.js';

import {
    vis_draw_actual_tree
} from './vis.js';

import {
    utils_generate_actual_tree,
    utils_generate_predict_tree
} from './utils.js';

var info_file = 'autoviz/data/info/0000f77c-6257be58.json';
var action_actual_file = 'autoviz/data/action_actual/0000f77c-6257be58.json';
var action_predict_file = 'autoviz/data/action_predict/0000f77c-6257be58.json';

map_initialize('map');
map_main.on('load', function() {

    // Resize map to fill the height
    map_main.resize();

    d3.json(info_file).then(function(trip) {
        d3.json(action_actual_file).then(function(actual) {
            d3.json(action_predict_file).then(function(predict) {

                console.log(trip);
                console.log(actual);
                console.log(predict);

                map_draw_trajectory(trip.gps);
                map_draw_start_end(trip.gps);

                let actual_data = utils_generate_actual_tree(trip, actual);
                vis_draw_actual_tree('vis-actual', actual_data, 'actual');

                let predict_data = utils_generate_predict_tree(predict);
                let predict_tree_data = utils_generate_actual_tree(trip, predict_data);
                vis_draw_actual_tree('vis-predict', predict_tree_data, 'predict');

                /*
                vis_draw_legend('vis-legend-bars', predict);
                vis_draw_output('vis-output', actual, predict);*/
            });
        });
    });

});
