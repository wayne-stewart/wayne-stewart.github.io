
(function(){
    "use strict";

    const query = (selector, el) => (el || document).querySelector(selector);
    const swap = (array, i, j) => { let temp = array[i]; array[i] = array[j]; array[j] = temp; };
    const swap_end = (array, i) => swap(array, i, array.length - 1);
    const each = (array, callback) => { for (let i = 0; i < array.length; i++) callback(array[i], i, array); };
    const each_reverse = (array, callback) => { for (let i = array.length - 1; i >= 0; i--) callback(array[i], i, array); };
    // this remove does not maintain array order!
    const remove_at = (array, index) => { swap_end(array, index); array.pop(); };
    const bind_event = (el, event_name, event_handler) => el.addEventListener(event_name, event_handler);
    const log_div = function(text) { 
	let container = query("#div_control");
	let div = document.createElement("div");
	div.innerHTML = text;
	container.appendChild(div);
    };

    let _canvas = null;
    let _canvas_cx = 0;
    let _canvas_cy = 0;
    let _2d_context = null;
    let _draw_needed = true;
    let _draw_objects = [];
    let _pixel_per_inch = 0.0;
    let _zoom_feet = 0.0;
    let _zoom_zero_feet = 0.0;
    let _mouse_down_over_interactable_object = false;
    let _dragging = false;
    let _mouse_down_x = 0;
    let _mouse_down_y = 0;
    let _control_down = false;
    const _zoom_smallest_feet = 5.0;
    const WALL = 1;
    const WINDOW = 2;
    const SEAT = 3;
    const LONG_SIDE = 5;
    const SHORT_SIDE = 6;
    const AIRVENT = 4;
    const WALL_WIDTH = 4.75;

    const max = (array, callback) => { 
        let max = null; 
        for (let i = 0; i < array.length; i++) { 
            let value = callback(array[i]); 
            if (max == null || value > max) { 
                max = value; 
            } 
        } 
        return max; 
    };

    const min = (array, callback) => { 
        let max = null; 
        for (let i = 0; i < array.length; i++) { 
            let value = callback(array[i]); 
            if (max == null || value < max) { 
                max = value; 
            } 
        } 
        return max; 
    };

    const max_dimension = (bounding_box) => Math.max(bounding_box.width, bounding_box.height);

    const init_canvas = function() {
        _canvas = query("#canvas_room");
        document.body.appendChild(_canvas);
        _2d_context = _canvas.getContext("2d");
        _canvas.style.position = "absolute";

        bind_event(_canvas, "mousedown", on_canvas_mousedown);
        bind_event(_canvas, "mouseup", on_canvas_mouseup);
        bind_event(_canvas, "mousemove", on_canvas_mousemove);
	bind_event(_canvas, "touchstart", on_canvas_mousedown);
	bind_event(_canvas, "touchend", on_canvas_mouseup);
	bind_event(_canvas, "touchmove", on_canvas_mousemove);
    };

    const init_controls = function() {
        bind_event(query("#btn_add_seat"), "click", on_btn_add_seat_click);
        bind_event(query("#btn_add_short_side"), "click", on_btn_add_short_side_click);
        bind_event(query("#btn_add_long_side"), "click", on_btn_add_long_side_click);
        bind_event(query("#btn_delete_selected"), "click", on_btn_delete_selected_click);
        bind_event(query("#btn_rotate_selected"), "click", on_btn_rotate_selected_click);
    };

    const resize_canvas = function() {
        _canvas.width = _canvas.clientWidth;
        _canvas.height = _canvas.clientHeight;
        _canvas_cx = _canvas.width / 2;
        _canvas_cy = _canvas.height / 2;

        // the default zoom level will contain the entire room
        // with enough about 1 foot of padding on each side
        let right = max(_draw_objects, a => get_bounding_box_inches(a).right);
        let left = min(_draw_objects, a => get_bounding_box_inches(a).left);
        let top = min(_draw_objects, a => get_bounding_box_inches(a).top);
        let bottom = max(_draw_objects, a => get_bounding_box_inches(a).bottom);
        let canvas_aspect = _canvas.width / _canvas.height;
        let room_aspect = (right - left) / (bottom - top);
        if (canvas_aspect > room_aspect) { 
            _zoom_zero_feet = bottom - top;
            _zoom_zero_feet = Math.ceil(_zoom_zero_feet / 12) + 1;
            _pixel_per_inch = _canvas.height / (_zoom_zero_feet * 12.0);
        } else {
            if (canvas_aspect > 1) {
                _zoom_zero_feet = right - left;
                _zoom_zero_feet = Math.ceil(_zoom_zero_feet / 12) + 1;
                _pixel_per_inch = _canvas.width / (_zoom_zero_feet * 12.0);
            }
            else {
                _zoom_zero_feet = right - left;
                _zoom_zero_feet = Math.ceil(_zoom_zero_feet / 12) + 1;
                _pixel_per_inch = _canvas.width / (_zoom_zero_feet * 12.0);
            }
        }
    };

    const on_window_resize = function() {
        resize_canvas();
        draw_needed();
    };

    const on_btn_add_seat_click = function() {
        let draw_object = make_seat(0,0, 35, 29);
        draw_object.selected = true;
        each(_draw_objects, a => a.selected = false);
        _draw_objects.push(draw_object);
        draw_needed();
    };

    const on_btn_add_short_side_click = function() { 
        let draw_object = make_short_side(0,0, 29, 6);
        draw_object.selected = true;
        each(_draw_objects, a => a.selected = false);
        _draw_objects.push(draw_object);
        draw_needed();
    };

    const on_btn_add_long_side_click = function() {
        let draw_object = make_long_side(0,0, 35, 6); 
        draw_object.selected = true;
        each(_draw_objects, a => a.selected = false);
        _draw_objects.push(draw_object);
        draw_needed();
    };

    const on_btn_delete_selected_click = function() {
        each_reverse(_draw_objects, (a,i) => {
            if (a.selected) {
                remove_at(_draw_objects, i);
            }
        });
        draw_needed();
    };

    const on_btn_rotate_selected_click = function() {
        let draw_object = get_selected_draw_object();
        if (draw_object) { 
            var temp = draw_object.w;
            draw_object.w = draw_object.h;
            draw_object.h = temp;
        }
        draw_needed();
    };

    const on_window_keydown = function(event) { 
        if (event.keyCode == 46) { // delete
            on_btn_delete_selected_click();
        }
        else if (event.keyCode == 17) { // ctrl
            _control_down = true;
        }
    };

    const on_window_keyup = function(event) { 
        if (event.keyCode == 17) { // ctrl
            _control_down = false;
        }
    };

    const on_canvas_mousedown = function(event) {
        const [x,y] = get_canvas_point_from_mouse_event(event);
        _mouse_down_x = x;
        _mouse_down_y = y;

        let draw_obj_and_index = get_draw_object_at(x,y);
        if (draw_obj_and_index && draw_object_is_interactable(draw_obj_and_index.draw_object)) {

            let draw_object = draw_obj_and_index.draw_object;
            let i = draw_obj_and_index.i;

            // control click to toggle mutli-select
            if (_control_down) {
                draw_object.selected = !draw_object.selected;
            }
            else if (!draw_object.selected) {
                each(_draw_objects, a => a.selected = false);
                draw_object.selected = true;
            }

            // move selected object to the end of the list so it is drawn on top
            swap_end(_draw_objects, i);

            _mouse_down_over_interactable_object = true;
            _dragging = false;
        }
        else {
            each(_draw_objects, a => a.selected = false);
        }

        draw_needed();
    };

    const on_canvas_mouseup = function(event) {
        const [x,y] = get_canvas_point_from_mouse_event(event);

        // if control is up, and we are not dragging, and we are not multi-selecting, then clear selection
        // except for the most recently selectect object
        if (_control_down == false && _dragging == false && _mouse_down_x == x && _mouse_down_y == y) {
            each(_draw_objects, (a,i) => {
                if (i != _draw_objects.length - 1) a.selected = false;
            });
        }
        _mouse_down_over_interactable_object = false;
        _dragging = false;
        draw_needed();
    };

    const on_canvas_mousemove = function(event) {
        const [x,y] = get_canvas_point_from_mouse_event(event);

        // only drag if the mouse is down and we are not multi-selecting with control
        if (_control_down == false && _mouse_down_over_interactable_object == true) {
            each(_draw_objects, draw_object => {
                if (draw_object.selected) {
                    draw_object.x += ((x - _mouse_down_x) / _pixel_per_inch);
                    draw_object.y += ((y - _mouse_down_y) / _pixel_per_inch);
                }
            });
            _mouse_down_x = x;
            _mouse_down_y = y;
            _dragging = true;
        }
        else {
            let hit_something = false;
            each_reverse(_draw_objects, (draw_object) => {
                let bounding_box = get_bounding_box_pixels(draw_object);
                if (is_point_in_box(x, y, bounding_box) && draw_object_is_interactable(draw_object) && !hit_something) {
                    draw_object.active = true;
                    hit_something = true;
                } else {
                    draw_object.active = false;
                }
            });
        }
        draw_needed();
    };

    const draw_needed = function() { _draw_needed = true; };

    const draw_loop = function() {
        if (_draw_needed) {
            draw();
        }
        requestAnimationFrame(draw_loop);
    };

    const draw = function() {
        _draw_needed = false;
        _2d_context.clearRect(0, 0, _canvas.width, _canvas.height);
        for (let i = 0; i < _draw_objects.length; i++) {
            let draw_object = _draw_objects[i];
            if (draw_object.t == WALL) { 
                draw_wall(_2d_context, draw_object);
            }
            else if (draw_object.t == WINDOW) {
                draw_window(_2d_context, draw_object);
            }
            else if (draw_object_is_interactable(draw_object)) {
                draw_seat(_2d_context, draw_object);
            } else if (draw_object.t == AIRVENT) {
                draw_airvent(_2d_context, draw_object);
            }
        }
    };

    const get_bounding_box_inches = function(draw_object) { 
        return {
            left: draw_object.x - (draw_object.w / 2),
            top: draw_object.y - (draw_object.h / 2),
            width: draw_object.w,
            height: draw_object.h,
            right: draw_object.x + (draw_object.w / 2),
            bottom: draw_object.y + (draw_object.h / 2)
        }
    };

    const get_bounding_box_pixels = function(draw_object) { 
        return {
            left: _canvas_cx + (draw_object.x - (draw_object.w / 2)) * _pixel_per_inch,
            top: _canvas_cy + (draw_object.y - (draw_object.h / 2)) * _pixel_per_inch,
            width: (draw_object.w) * _pixel_per_inch,
            height: (draw_object.h) * _pixel_per_inch,
            right: _canvas_cx + (draw_object.x + (draw_object.w / 2)) * _pixel_per_inch,
            bottom: _canvas_cy + (draw_object.y + (draw_object.h / 2)) * _pixel_per_inch
        }
    };

    const get_canvas_point_from_mouse_event = function(event) {
        let canvas_rect = _canvas.getBoundingClientRect();
	let x = 0, y = 0;
	let t = event.targetTouches;
	if (t && t[0]) { 
	    x = t[0].pageX;
	    y = t[0].pageY;
	
	//log_div("touch: " + x + ", " + y);
	} else {
	    x = event.clientX;
	    y = event.clientY;
	//log_div("mouse: " + x + ", " + y);
	}
        x = x - canvas_rect.left;
        y = y - canvas_rect.top;
        return [x,y];
    };

    const is_point_in_box = function(x, y, bounding_box) {
        return x >= bounding_box.left && x <= bounding_box.right && y >= bounding_box.top && y <= bounding_box.bottom;
    };

    const get_draw_object_at = function(x, y) {
        for (let i = _draw_objects.length - 1; i >= 0; i--) { 
            let draw_object = _draw_objects[i];
            let bounding_box = get_bounding_box_pixels(draw_object);
            if (x >= bounding_box.left && x <= bounding_box.right && y >= bounding_box.top && y <= bounding_box.bottom) {
                return {draw_object, i};
            }
        }
        return null;
    };

    const get_selected_draw_object = function() { 
        for (let i = 0; i < _draw_objects.length; i++) {
            let draw_object = _draw_objects[i];
            if (draw_object.selected) {
                return draw_object;
            }
        }
        return null;
    };

    const draw_object_is_interactable = (draw_object) => draw_object.t == SEAT || draw_object.t == LONG_SIDE || draw_object.t == SHORT_SIDE;

    const draw_wall = function(context, draw_object) { 
        let bounding_box = get_bounding_box_pixels(draw_object);
        context.fillStyle = "#000000";
        context.fillRect(bounding_box.left, bounding_box.top, bounding_box.width, bounding_box.height);
    };

    const draw_airvent = function(context, draw_object) {
        let bounding_box = get_bounding_box_pixels(draw_object);
        context.fillStyle = "#E5486D";
        context.strokeStyle = "#DB1B48";
        context.lineWidth = max_dimension(bounding_box) * 0.02;
        context.beginPath();
        context.roundRect(bounding_box.left,
            bounding_box.top,
            bounding_box.width,
            bounding_box.height, max_dimension(bounding_box) * 0.02);
        context.fill();
        context.stroke();
    };

    const draw_seat = function(context, draw_object) {
        let bounding_box = get_bounding_box_pixels(draw_object);
        if (draw_object.selected) {
            context.strokeStyle = "#FF0000"; // "#060976";
        } else {
            context.strokeStyle = "#37399A";
        }
        context.lineWidth = max_dimension(bounding_box) * 0.02;
        if (draw_object.active) {
            context.fillStyle = "#9293EF";
        } else {
            context.fillStyle = "#5F61D4";
        }
        context.beginPath();
        context.roundRect(bounding_box.left,
            bounding_box.top,
            bounding_box.width,
            bounding_box.height, max_dimension(bounding_box) * 0.02);
        context.fill();
        context.stroke();
    };

    const draw_window = function(context, draw_object) {
        let bounding_box = get_bounding_box_pixels(draw_object);
        context.fillStyle = "#FFFFFF";
        context.fillRect(bounding_box.left, bounding_box.top, bounding_box.width, bounding_box.height);
        context.fillStyle = "#000000";
        if (draw_object.w > draw_object.h) {
            context.fillRect(bounding_box.left, bounding_box.top + WALL_WIDTH * _pixel_per_inch / 3, bounding_box.width, bounding_box.height/3);
        }
        else {
            context.fillRect(bounding_box.left + WALL_WIDTH * _pixel_per_inch / 3, bounding_box.top, bounding_box.width / 3, bounding_box.height);
        }
    };

    /**
     * @param {number} x - x coordinate of center of wall
     * @param {number} y - y coordinate of center of wall
     * @param {number} l - length of wall in inches
     * @param {number} o - orientation of wall in degrees
     */
    const make_wall = (x, y, l, o) => {
        return {
            t: WALL, 
            x, 
            y, 
            w: (o == 0 || o == 180) ? l : WALL_WIDTH, 
            h: (o == 90 || o == 270) ? l : WALL_WIDTH,
            active: false,
            selected: false
        };
    };
    const make_window = (x, y, l, o) => {
        return {
            t: WINDOW, 
            x, 
            y, 
            w: (o == 0 || o == 180) ? l : WALL_WIDTH, 
            h: (o == 90 || o == 270) ? l : WALL_WIDTH,
            active: false,
            selected: false
        };
    };

    // 11.5 5.5 4.5 46.5
    const make_airvent = (x, y) => { return { t: AIRVENT, x, y, w: 11.5, h: 5.5, active: false, selected: false } };
    const make_seat = (x, y, w, h) => { return { t: SEAT, x, y, w, h, active: false, selected: false } };
    const make_long_side = (x,y,w,h) => { return { t: LONG_SIDE, x, y, w, h, active: false, selected: false } };
    const make_short_side = (x,y,w,h) => { return { t: SHORT_SIDE, x, y, w, h, active: false, selected: false } };

    const init_room = function() {
        const half_wall_width = WALL_WIDTH / 2;

        // top wall
        _draw_objects.push(make_wall(0, -142/2 - half_wall_width, 231, 0));

        // left wall
        _draw_objects.push(make_wall(-231/2 - half_wall_width, -142/2 + 72/2, 72, 270));
        _draw_objects.push(make_wall(-231/2 - half_wall_width, 142/2 - 37/2, 37, 270));

        // right wall
        _draw_objects.push(make_wall(231/2 + half_wall_width, 0, 142, 90));

        // bottom wall
        _draw_objects.push(make_wall(231/2 - 40.75/2, 142/2 + half_wall_width, 40.75, 0));
        _draw_objects.push(make_wall(231/2 - 86/2 - 40.75 - 61.5, 142/2 + half_wall_width, 86, 0));

        // windows
        _draw_objects.push(make_window(231/2 - 51.5, -142/2 - half_wall_width, 50.5, 0));
        _draw_objects.push(make_window(-231/2 + 46.75, -142/2 - half_wall_width, 50.5, 0));

        // airvents
        _draw_objects.push(make_airvent(-231/2 + 46.5 + 11.5/2, -142/2 + 4.5 + 5.5/2));
        _draw_objects.push(make_airvent(231/2 - 46.5 - 11.5/2, -142/2 + 4.5 + 5.5/2));
    };

    init_canvas();
    init_room();
    init_controls();
    resize_canvas();
    bind_event(window, "resize", on_window_resize);
    bind_event(window, "keydown", on_window_keydown);
    bind_event(window, "keyup", on_window_keyup);
    draw_loop();
})();
