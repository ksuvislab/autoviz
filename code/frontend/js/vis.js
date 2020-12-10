import {
    utils_transpose
} from './utils.js';

var driving_actions = ['straight', 'slow_or_stop', 'turn_left', 'turn_right', 'turn_left_slight', 'turn_right_slight'];

export function vis_draw_legend(container_id, prediction_scores)
{
    let width = $('#' + container_id).width();
    let height = $('#' + container_id).height();


    let mins = [], maxs = [];
    for (let i = 0; i < prediction_scores.output.length; ++i) {
        mins.push(d3.min(prediction_scores.output[i]));
        maxs.push(d3.max(prediction_scores.output[i]));

    }

    let min = d3.min(mins);
    let max = d3.max(maxs);
    $('#vis-legend-min').html(min.toFixed(2) + '&nbsp;&nbsp;');
    $('#vis-legend-max').html('&nbsp;&nbsp;' + max.toFixed(2));

    let svg = d3.select("#" + container_id)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g");

    let color_scale = d3.scaleSequential(d3.interpolateGreens)
                .domain([0, width]);

    let bars = svg.selectAll('.bars')
                .data(d3.range(width), function(d) { return d; })
                .enter().append('rect')
                .attr('class', 'bars')
                .attr('x', function(d, i) { return i; })
                .attr('y', 0)
                .attr('height', height)
                .attr('width', 1)
                .style('fill', function(d, i) { return color_scale(d); });
}

export function vis_draw_output(container_id, actual_scores, prediction_scores)
{
    let T_prediction_scores = utils_transpose(prediction_scores.output);
    let action_numbers =  T_prediction_scores.length;

    let sign_height = $('#' + container_id).height() / action_numbers;

    for (let i = 0; i < action_numbers; ++i) {
        let action_container = $('<div/>', {
            id: 'action-' + driving_actions[i]
        }).css({
            width: '100%', height: sign_height,
            'box-sizing': 'border-box'
        });

        let action_sign_image = $('<img/>', {
            alt: '',
            src: '/resources/signs/' + driving_actions[i] + '.png'
        }).css({
            height: '100%',
            width: sign_height,
            float: 'left'
        });

        let action_bars = $('<div/>', {
            id: 'action-bar-' + driving_actions[i],
        }).css({
            height: '100%',
            width: 'calc(100% - ' + sign_height + 'px)',
            float: 'left'
        });

        action_container.append(action_sign_image);
        action_container.append(action_bars);

        $('#' + container_id).append(action_container);
    }

    console.log(prediction_scores.output);

    // Draw heatmap
    for (let i = 0; i < T_prediction_scores.length; ++i) {

        let width = $('#' + 'action-bar-' + driving_actions[i]).width();
        let height = $('#' + 'action-bar-' + driving_actions[i]).height();

        let svg = d3.select('#' + 'action-bar-' + driving_actions[i])
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g");

        let rect_width = width / prediction_scores.output.length;
        let rect_height = rect_width;

        for(let j = 0; j < prediction_scores.output.length; ++j) {
            //console.log(prediction_scores.output[j]);
            let min = d3.min(prediction_scores.output[j]);
            let max = d3.max(prediction_scores.output[j]);
            let color_scale = d3.scaleSequential(d3.interpolateGreens)
                .domain([min, max]);

            let bars = svg.append('rect')
                .attr('class', 'prediction-heatmap')
                .attr("rx", 4)
                .attr("ry", 4)
                .attr('x', j * rect_width)
                .attr('y', 0)
                .attr('height', rect_height)
                .attr('width', rect_width)
                .style('fill', color_scale(T_prediction_scores[i][j]))
                .style('cursor', 'pointer');

            if (actual_scores.output[j] === i)  {
                bars.attr('stroke', '#d73027');
                bars.attr('stroke-width', '3px');
            } else {
                bars.attr('stroke', '#2A303C');
                bars.attr('stroke-width', '2px');
            }
        }
    }
}