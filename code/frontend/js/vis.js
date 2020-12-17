import {
    utils_transpose
} from './utils.js';

import {
    map_draw_locations
} from './map.js';

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
    $('#vis-legend-min').html('0' + '&nbsp;&nbsp;');
    $('#vis-legend-max').html('&nbsp;&nbsp;' + '100%');

    let svg = d3.select("#" + container_id)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g");

    let color_scale = d3.scaleSequential(d3.interpolateYlGnBu)
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
            src: 'autoviz/resources/signs/' + driving_actions[i] + '.png'
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
            float: 'left',
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
        let rect_height = height / 2;

        for(let j = 0; j < prediction_scores.output.length; ++j) {
            //console.log(prediction_scores.output[j]);
            let min = d3.min(prediction_scores.output[j]);
            let max = d3.max(prediction_scores.output[j]);
            let color_scale = d3.scaleSequential(d3.interpolateYlGnBu)
                .domain([min, max]);

            let bars = svg.append('rect')
                .attr('class', 'prediction-heatmap')
                .attr("rx", 2)
                .attr("ry", 2)
                .attr('x', j * rect_width)
                .attr('y', rect_height /  2)
                .attr('height', rect_height)
                .attr('width', rect_width)
                .style('fill', color_scale(T_prediction_scores[i][j]))
                .style('cursor', 'pointer');

            if (actual_scores.output[j] === i)  {
                if (T_prediction_scores[i][j] !== max) {
                    bars.attr('stroke', '#ff0000');
                    bars.attr('stroke-width', '2px');
                } else {
                    bars.attr('stroke', '#10ff00');
                    bars.attr('stroke-width', '2px');
                }
            } else {
                bars.attr('stroke', '#2A303C');
                bars.attr('stroke-width', '0.5px');
            }
        }
    }
}

export function  vis_draw_actual_tree(container_id, data, data_type) {

    let margin = {top: 20, right: 100, bottom:  20, left: -100},
        width = $('#' + container_id).width() - margin.right - margin.left,
        height = $('#' + container_id).height() - margin.top - margin.bottom;

    let  svg = d3.select('#' + container_id).append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
            .attr('transform', 'translate('  + margin.left + ',' + margin.top + ')');

    let i = 0,
        duration = 750,
        root;

    let tree =  d3.tree().size([height, width]);

    root = d3.hierarchy(data, function(d) { return d.children });
    root.x0 = height / 2;
    root.y0 = 0;
    //root.data.children = root.data.children.reverse();

    root.children.forEach(collapse);
    update(root, data);


    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function update(source, original_data) {

        let tree_data =  tree(root);
        let nodes = tree_data.descendants(),
            links = tree_data.descendants().slice(1);

        nodes.forEach(function(d) { d.y = d.depth * 120 });
        let node = svg.selectAll('g.node')
            .data(nodes, function(d) { return d.id || (d.id = ++i )});

        let nodeEnter = node.enter().append('g')
            .attr('class', function(d) {
                return 'node node-' + d.depth;
            })
            .attr('transform', function(d) {
                return 'translate(' + source.y0 + ',' + source.x0 + ')';
            })
            .on('click', click);

        // Find min max of datasets

        let children_count = [];
        original_data.children.forEach(function(item) {
            children_count.push(item.children.length);
        });

        // Create min and max
        let min = d3.min(children_count);
        let max  = d3.max(children_count);
        let image_size_scale = d3.scaleLinear().domain([min, max]).range([30, 45]);

        nodeEnter.append('defs')
            .attr('height', function(d) {
                return (d.data.children) ? image_size_scale(d.data.children.length) : 35;
            })
            .attr('width', function(d) {
                return (d.data.children) ? image_size_scale(d.data.children.length) : 35;
            })
            .attr('x', -15)
            .attr('y', -15);

        nodeEnter.append('image')
            .attr('xlink:href', function(d, i) {
                return (d.data.children) ? d.data.photo : null;
            })
            .attr('height', function(d) {
                return (d.data.children) ? image_size_scale(d.data.children.length) : 35;
            })
            .attr('width', function(d) {
                return (d.data.children) ? image_size_scale(d.data.children.length) : 35;
            })
            .attr('x', -15)
            .attr('y', -15)
            .style('cursor', 'pointer');

        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 5)
            .style('fill', function(d) {
                return d.children ? 'lightsteelblue' : '#fff';
            })
            .style('opacity', 0);

        nodeEnter.append('text')
            .attr('dy', '.35em')
            .attr('x', function(d) {
                return (d.data.children) ? 15 : 10;
            })
            .attr('y', function(d) {
                return (d.data.children) ? -15 : 0;
            })
            .attr('text-anchor', function(d) {
                return  'start';
            })
            .text(function(d) {
                if (d.data.children) {
                    return d.data.children.length;
                } else {
                    if (d.data.location) {
                        let c = d.data.location.course.toFixed(2);
                        let s = d.data.location.speed.toFixed(2);
                        return 'Speed: ' + s + ' ' + 'Course: ' + c;
                    } else {
                        return 'None';
                    }
                }
            });

        let nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition()
            .duration(duration)
            .attr('transform', function(d) {
                return  'translate(' + d.y + ',' + d.x + ')';
            });

        nodeUpdate.select('circle.node')
            .attr('r', 2.5)
            .style('fill', function(d) {
                return d._children ? 'lightsteelblue' : '#bf616a';
            })
            .style('opacity', function(d) {
                return (d.data.children) ? 0: 1;
            })
            .attr('cursor', 'pointer');

        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr('transform', function(d) {
                return 'translate(' + source.y + ',' + source.x + ')';
            })
            .remove();
        /*
        nodeExit.select('circle')
            .attr('r', 5);

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);
        */

        // Link
        let link = svg.selectAll('path.link')
            .data(links, function(d) { return  d.id; });
        let linkEnter = link.enter().insert('path', 'g')
            .attr('class', function(d) {
                return 'link link-' + d.depth;
            })
            .attr('d', function(d) {
                let o = { x: source.x0, y: source.y0 }
                return diagonal(o, o);
            });

        let linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d) { return diagonal(d, d.parent) });

        let linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
                let o = {x: source.x, y: source.y};
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s, d) {
            let path  = `M ${s.y} ${s.x}
                     C ${(s.y + d.y) / 2} ${s.x}
                       ${(s.y + d.y) / 2} ${d.x}
                       ${d.y} ${d.x}`
            return path;
        }

        function click(d) {

            if (d.depth == 1) {
                root.children.forEach(collapse);
            }

            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
                // close
                map_draw_locations(d.children, data_type);
            }
            update(d, original_data);
        }
    }
}
