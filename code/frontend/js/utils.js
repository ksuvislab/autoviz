let CAR_ACTIONS = ['straight', 'slow_or_stop', 'turn_left', 'turn_right', 'turn_left_slight', 'turn_right_slight'];
let POINT_SIZE = 40;


export function utils_transpose(array) {
    return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
}

export function utils_generate_actual_tree(trip, actual_data) {

    let actions = actual_data.output;
    let locations = resize_array(trip.locations);
    console.log(locations);
    let aggregate_str = get_aggregation_string(actions);

    let aggregate_actions = aggregate_str.split(" ");
    // Remove last empty element
    aggregate_actions.pop();

    let tree_data = {
        'name': 'null',
        'children': []
    }

    let index = 0;

    for (let i = 0; i < aggregate_actions.length; ++i) {

        let action = aggregate_actions[i].split('-')[0];
        let count = aggregate_actions[i].split('-')[1];

        let child = {
            'name': CAR_ACTIONS[action],
            'parent': 'null',
            'photo': 'resources/signs/' + CAR_ACTIONS[action] + '.png',
            'size': parseInt(count),
            'children': []
        }

        for (let j = 0; j < count; ++j) {

            // Calculate actual trip index
            let trip_index = Math.round(index / 2.7);

            child.children.push({
                'name': CAR_ACTIONS[action],
                'parent': CAR_ACTIONS[action],
                'size': 1,
                'location': locations[trip_index],
                'photo': 'resources/signs/' + CAR_ACTIONS[action] + '.png',
            });

            ++index;
        }
        // Add all chidren to tree data
        tree_data.children.push(child);
    }

    return tree_data;
}

export function utils_generate_predict_tree(predict_data) {
    let predict_output = predict_data.output;
    let actions = {output: []};
    for (let i = 0; i < predict_output.length; ++i) {
        let action = predict_output[i].indexOf(Math.max(...predict_output[i]));
        //if (action == 1) { action = 0};
        actions.output.push(action);
    }
    return actions;
}

function get_aggregation_string(actions_array) {
    let aggregate_actions = "";
    let prev = actions_array[0];
    let count = 0;

    for (let i = 1; i < actions_array.length; ++i) {

        if (actions_array[i] == prev) {
            count += 1;
            prev = actions_array[i];
        } else {
            aggregate_actions += prev.toString() + "-" + (count + 1).toString() + " ";
            count = 0;
            prev = actions_array[i];
        }
    }
    // Get last group
    aggregate_actions += prev.toString() + "-" + (count + 1).toString() + " ";
    return aggregate_actions;
}

function resize_array(gps_points) {
    let last_point =  gps_points[gps_points.length - 1];
    while (gps_points.length > POINT_SIZE) { gps_points.pop(); }
    while (gps_points.length < POINT_SIZE) { gps_points.push(last_point); }
    return gps_points;
}
