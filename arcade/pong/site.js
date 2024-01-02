
(function(){
    "use strict";

    let canvas;
    let gl;
    let gl_program;
    let gl_buffer;
    let font_base = 1000;
    let font_size = 48;
    let font_scale = font_size / font_base;
    let p1_score = 0;
    let p2_score = 0;
    let p1_paddle = 0.0;
    let p2_paddle = 0.0;
    let ball_x = 0.0;
    let ball_y = 0.0;
    let paddle_vertex_array;
    let paddle_vertex_buffer;
    let paddle_vertex_component_count = 2;
    let paddle_vertex_count;
    let current_rotation = [0,1];
    let current_scale = [1.0, 1.0];
    let current_translation = [0.0, 0.0];
    let key_pressed_up_arrow = false;
    let key_pressed_down_arrow = false;
    
    let game_running = true;

    const resize_canvas = function() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    const key_handler = function(event) {
        let key_pressed = event.type === "keydown";
        switch(event.keyCode) {
            case 38:
                key_pressed_up_arrow = key_pressed;
                break;
            case 40:
                key_pressed_down_arrow = key_pressed;
                break;
            case 27:
                game_running = false;
                clean_gl();
                break;
        }
    }

    const draw = function() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.8, 0.9, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let aspect_ratio = canvas.width / canvas.height;
        current_scale[1] = aspect_ratio;

        current_translation[0] = -0.9;
        current_translation[1] = p1_paddle;
        draw_paddle();

        current_translation[0] = 0.9;
        current_translation[1] = p2_paddle;
        draw_paddle();
    };

    const draw_paddle = function() {
        gl.useProgram(gl_program);
        let scaling_factor = gl.getUniformLocation(gl_program, "scaling_factor");
        let color = gl.getUniformLocation(gl_program, "color");
        let rotation_vector = gl.getUniformLocation(gl_program, "rotation_vector");
        let translation_vector = gl.getUniformLocation(gl_program, "translation_vector");
        let position = gl.getAttribLocation(gl_program, "position");
        gl.uniform2fv(scaling_factor, current_scale);
        gl.uniform2fv(rotation_vector, current_rotation);
        gl.uniform2fv(translation_vector, current_translation);
        gl.uniform4fv(color, [0.1, 0.7, 0.2, 1.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, paddle_vertex_buffer);
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, paddle_vertex_component_count, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, paddle_vertex_count);
    };

    const update = function() {
        if (key_pressed_up_arrow) {
            p1_paddle += 0.01;
        } else if (key_pressed_down_arrow) {
            p1_paddle -= 0.01;
        }
        ball_x += 0.01;
        ball_y += 0.01;
    }

    const game_loop = function() {
        if (game_running) {
            update();
            draw();
            requestAnimationFrame(game_loop);
        }
    };

    const show_webgl_init_error = function() {
        let ctx = canvas.getContext("2d");
        ctx.font = "bold "+(canvas.width * font_scale)+"px monospace";
        let padding = canvas.width * 0.01;
        let text = "WebGL not supported";
        let text_metrics = ctx.measureText(text);
        ctx.fillText(text, 
            canvas.width / 2 - text_metrics.width / 2,
            padding + text_metrics.actualBoundingBoxAscent);
    };

    const clean_gl = function() {
        if (gl) {
            gl.useProgram(null);
            if (gl_buffer) {
                gl.deleteBuffer(gl_buffer);
                gl_buffer = null;
            }
            if (gl_program) {
                gl.deleteProgram(gl_program);
                gl_program = null;
            }
            gl = null;
        }
    };

    const compile_shader = function(source, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log("error: could not compile shader");
            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(fragment_shader);
            return null;
        }
        return shader;
    };

    const create_program = function(shaders) {
        let program = gl.createProgram();
        for (let i = 0; i < shaders.length; i++) {
            gl.attachShader(program, shaders[i]);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log("error: could not initialize shaders");
            console.log(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    };

    window.addEventListener("load", function() {
        canvas = document.querySelector("canvas");
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
            show_webgl_init_error();
            return;
        }

        // init gl
        let source = document.querySelector("#vertex-shader").innerHTML;
        let vertex_shader = compile_shader(source, gl.VERTEX_SHADER);
        source = document.querySelector("#fragment-shader").innerHTML;
        let fragment_shader = compile_shader(source, gl.FRAGMENT_SHADER);
        gl_program = create_program([vertex_shader, fragment_shader]);

        // init paddel vertex buffer
        paddle_vertex_array = new Float32Array([
            -0.025, 0.1,
            0.025, 0.1,
            0.025, -0.1,
            -0.025, 0.1,
            0.025, -0.1,
            -0.025, -0.1]);
        paddle_vertex_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, paddle_vertex_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, paddle_vertex_array, gl.STATIC_DRAW);
        paddle_vertex_component_count = 2;
        paddle_vertex_count = paddle_vertex_array.length / paddle_vertex_component_count;

        window.addEventListener("resize", resize_canvas);
        window.addEventListener("keydown", key_handler);
        window.addEventListener("keyup", key_handler);

        resize_canvas();
        game_loop();
    });
})();
