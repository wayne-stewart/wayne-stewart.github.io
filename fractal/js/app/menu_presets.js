
define([], function() { 

    return [
        {
            default: true,
            name: "Glynn",
            type: "glynn",
            iterations: 512,
            constant_a: -0.2,
            constant_b: 0,
            factor: 1.5
        },
        {
            name: "Glynn 1",
            type: "glynn",
            iterations: 512,
            constant_a: -0.2,
            constant_b: 0,
            factor: 1.5,
            scale: 6.5,
            translate: -0.54,
            rotate: 90
        },
        {
            name: "Julia",
            default: true,
            type: "julia",
            iterations: 256,
            constant_a: 0,
            constant_b: 0.67
        },
        {
            name: "Mandelbrot",
            default: true,
            type: "mandelbrot",
            iterations: 256,
            constant_a: 0,
            constant_b: 0
        }
    ];

});