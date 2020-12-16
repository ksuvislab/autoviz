import tensorflow as tf
import numpy as np
import math
import sys

# How many frames in a single TFRecord, this is conservatively set to 36second * 15fps
FRAMES_IN_SEG = 540
# If true, use fixed downsample method
NON_RANDOM_TEMPORAL_DOWNSAMPLE = False
# The original video is in 15 FPS, this flag optionally downsample the video temporally, All other frame related operations are carried out after temporal downsampling
TEMPORAL_DOWNSAMPLE_FACTOR = 5
# Shift the stop labels * frames forward, to predict the future
STOP_FUTURE_FRAMES = 2
# If the speed is less than this, then it's considered to be stopping
SPEED_LIMIT_AS_STOP = 0.3
# Turning settings
NO_SLIGHT_TURN = False
DECELERATION_THRES = -1.0
FRAME_RATE = 15.0
N_SUB_FRAME = 108
# Car actions enum
CAR_ACTIONS = {  'not_sure': -1, 'straight': 0, 'slow_or_stop': 1,
                  'turn_left': 2, 'turn_right': 3,
                  'turn_left_slight': 4, 'turn_right_slight': 5,}
                  # 'acceleration': 6, 'deceleration': 7 }

def read_from_tfrecords(filenames):
    tfrecord_file_queue = tf.train.string_input_producer(filenames, name='queue')
    # Initialize tfrecords reader
    reader = tf.TFRecordReader()
    _, example_serialized = reader.read(tfrecord_file_queue)
    # Extract features
    features = tf.parse_single_example(example_serialized, features = {
        'image/encoded': tf.VarLenFeature(dtype=tf.string),
        'image/speeds': tf.VarLenFeature(dtype=tf.float32),
        'image/class/video_name': tf.FixedLenFeature([1], dtype=tf.string, default_value='')
    }, name = 'features')

    return features

def reshape_speeds(features):

    if NON_RANDOM_TEMPORAL_DOWNSAMPLE:
        tstart = 0
    else:
        tstart = tf.random_uniform([], minval=0, maxval=TEMPORAL_DOWNSAMPLE_FACTOR, dtype=tf.int32)

    len_downsampled = FRAMES_IN_SEG // TEMPORAL_DOWNSAMPLE_FACTOR

    speed = features['image/speeds'].values
    speed = tf.reshape(speed, [-1, 2])
    speed = speed[:FRAMES_IN_SEG, :]
    speed = speed[tstart::TEMPORAL_DOWNSAMPLE_FACTOR, :]
    speed.set_shape([len_downsampled, 2])

    return speed

def turn_future_smooth(speed, nfuture, naction, speed_limit_as_stop):
    # this function takes in the speed and output a turning actions
    turn = turning_heuristics(speed, speed_limit_as_stop)
    return turn

def turning_heuristics(speed_list, speed_limit_as_stop = 0):
    course_list  = to_course_list(speed_list)
    speed_v = np.linalg.norm(speed_list, axis = 1)

    l = len(course_list)
    action =  np.zeros(l).astype(np.int32)
    course_diff = np.zeros(l).astype(np.float32)

    thresh_low = (2 * math.pi / 360) * 1
    thresh_high = (2 * math.pi / 360) * 35
    thresh_slight_low = (2 * math.pi / 360) * 3

    enum = CAR_ACTIONS

    for i in range(l):
        if i == 0:
            action[i] = enum['not_sure']
            continue

        if speed_v[i] <  speed_limit_as_stop + 1e-3:
            action[i] = enum['slow_or_stop']
            continue

        course = course_list[i]
        prev = course_list[i - 1]

        if course is None or prev is None:
            action[i] = enum['slow_or_stop']
            course_diff[i] =  9999
            continue

        course_diff[i] = diff(course, prev)  *  360 /  (2 * math.pi)

        print('Calculate turning')
        print(str(thresh_high))
        print(str(thresh_low))
        print(str(diff(course, prev)))

        if thresh_high  > diff(course, prev)  >  thresh_low:
            if diff(course, prev) > thresh_slight_low:
                action[i] = enum['turn_right']
            else:
                action[i]  =  enum['turn_right_slight']

        elif -thresh_high < diff(course, prev) <  -thresh_low:
            if diff(course, prev) < -thresh_slight_low:
                action[i] = enum['turn_left']
            else:
                action[i] = enum['turn_left_slight']
        elif diff(course, prev) >= thresh_high or diff(course, prev) <= -thresh_high:
            action[i] = enum['not_sure']
        else:
            action[i] = enum['straight']

        if NO_SLIGHT_TURN:
            if action[i] == enum['turn_left_slight']:
                action[i] = enum['turn_left']
            if action[i] == enum['turn_right_slight']:
                action[i] = enum['turn_right']

        if DECELERATION_THRES > 0 and action[i] == enum['straight']:
            hz = FRAME_RATE / TEMPORAL_DOWNSAMPLE_FACTOR
            acc_now = (speed_v[i] - speed_v[i - 1]) / (1.0 / hz)
            if acc_now  < -DECELERATION_THRES:
                action[i] = enum['slow_or_stop']
                continue

    action[0] = action[1]
    return action

def speed_to_course(speed):
    pi = math.pi
    if speed[1] == 0:
        if speed[0] > 0:
            course = pi / 2
        elif speed[0] == 0:
            course = None
        elif speed[0] < 0:
            course = 3 * pi / 2
        return course
    course = math.atan(speed[0] / speed[1])
    if course < 0:
        course = course + 2 * pi
    if speed[1] > 0:
        course = course
    else:
        course = pi + course
        if course > 2 * pi:
            course = course - 2 * pi
    assert not math.isnan(course)
    return course

def to_course_list(speed_list):
    l = speed_list.shape[0]
    course_list = []
    for i in range(l):
        speed = speed_list[i,:]
        course_list.append(speed_to_course(speed))
    return course_list

def diff(a, b):
    # return a-b \in -pi to pi
    d = a - b
    if d > math.pi:
        d -= math.pi * 2
    if d < -math.pi:
        d += math.pi * 2
    return d

if __name__ == '__main__':
    """ Get actual labels based on speed values """

    # Input filenams
    filenames = ['../../data/tf_records/0000f77c-6257be58.tfrecords']

    # Read tfrecords
    features = read_from_tfrecords(filenames)
    speeds = reshape_speeds(features)

    # 108
    len_downsampled = FRAMES_IN_SEG // TEMPORAL_DOWNSAMPLE_FACTOR


    try:
        turn_int2str = {y: x for x, y in CAR_ACTIONS.iteritems()}
    except AttributeError:
        turn_int2str = {y: x for x, y in CAR_ACTIONS.items()}

    try:
        naction = np.sum(np.less_equal(0, np.array(CAR_ACTIONS.values())))
    except TypeError:
        naction = np.sum(np.less_equal(0, np.array(list(CAR_ACTIONS.values()))))

    # Note that the turning heuristic is tuned for 3Hz video and urban area
    # Note also that stop_future_frames is reused for the turn
    """
    turn = tf.py_func(  turn_future_smooth,
                        [speeds, STOP_FUTURE_FRAMES, naction, SPEED_LIMIT_AS_STOP],
                        [tf.float32])[0]

    turn.set_shape([len_downsampled, naction])# Note that the turning heuristic is tuned for 3Hz video and urban area
    """
    # Note also that stop_future_frames is reused for the turn
    turn = tf.py_func(  turn_future_smooth,
                        [speeds, STOP_FUTURE_FRAMES, naction, SPEED_LIMIT_AS_STOP],
                        [tf.int32])[0]
    turn.set_shape([len_downsampled, naction])
    print(turn)
    # Run tensorflow py_func
    with tf.Session() as sess:
        tf.initialize_all_variables().run()
        # Adding these 2 lines fixed thee hang forever problem
        coord = tf.train.Coordinator()
        threads = tf.train.start_queue_runners(sess=sess, coord=coord)

        speed_list = sess.run(speeds).tolist()
        print speed_list

        # Convert ndarray to list
        actions_list = sess.run(turn).tolist()
        print(actions_list)
