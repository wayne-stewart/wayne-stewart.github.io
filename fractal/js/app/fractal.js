

define(["app/complex", "app/Color", "app/fractal_julia", "app/fractal_mandelbrot", "app/fractal_glynn"], function(Complex, Color) { 
	
	var Fractal = function(eventBus) { 
			
		var RotateTransform = function(angle) { 
			this.transform = function(x, y) { 
				if (angle == 0) {
					return {x:x, y:y};
				}
				else {
					var p = { 
						x: x * Math.cos(angle) - y * Math.sin(angle), 
						y: y * Math.cos(angle) + x * Math.sin(angle)
					};
					return p;
				}
			};
		};

		var MapCanvasToGraph = function(screenRect, graphRect) {
			this.transform = function(x, y) {
				var p = {
					x: graphRect.x + graphRect.w*(x/screenRect.w),
					y: graphRect.y - graphRect.h*(y/screenRect.h)
				};
				return p;
			};
		};

		var createGraphRect = function(renderParameters, canvasRect) {
			var graphAspectRatio = renderParameters.rect_h / renderParameters.rect_w;
			var canvasAspectRatio = canvasRect.h / canvasRect.w;
			var x,y,w,h;
			// aspect ratios are exactly the same so the parameters can be used directly
			if (graphAspectRatio == canvasAspectRatio) {
				x = renderParameters.rect_x;
				y = renderParameters.rect_y;
				w = renderParameters.rect_w;
				h = renderParameters.rect_h;
			}

			// here we are extending the width beyond what the initial parameters specify
			else if (graphAspectRatio > canvasAspectRatio) {
				y = renderParameters.rect_y;
				h = renderParameters.rect_h;
				w = h / canvasAspectRatio;
				x = renderParameters.rect_x + (renderParameters.rect_w / 2) - (w / 2);
			}

			// here we are extending the height beyond what the initial parameters specify
			else {
				x = renderParameters.rect_x;
				w = renderParameters.rect_w;
				h = w * canvasAspectRatio;
				y = renderParameters.rect_y - (renderParameters.rect_h / 2) + (h / 2);
			}
			var graphRect = { x:x, y:y, w:w, h:h };
			return graphRect;
		};
		
		var initGraph = function(renderParameters, canvasRect) { 
			var graphRect = createGraphRect(renderParameters, canvasRect);
			var t_canvasToGraph = new MapCanvasToGraph(canvasRect, graphRect);
			var t_rotate = new RotateTransform(renderParameters.rotate);
			eventBus.send("set:canvas:graphTransform", t_canvasToGraph);
			return {
				transform:function(x, y) {
					var p = t_canvasToGraph.transform(x, y);
					p = t_rotate.transform(p.x, p.y);
					return p;
				}
			};
		};
		
		var render = function(renderParameters, fractalImpl, imgData, canvasRect, canvasToGraph, colorMap) { 
			var max_iterations = renderParameters.iterations;

			for ( var y = 0; y < canvasRect.h; y++ ) {
				for ( var x = 0; x < canvasRect.w; x++ ) {
			
					var i = canvasRect.w * y + x;
					var v = 0;
					
					var gp = canvasToGraph.transform(x, y);
					
					v = fractalImpl.iterate(new Complex(gp.x,gp.y),max_iterations);
					
					var c = v == -1 ? { r:0, g:0, b:0 } : colorMap[Math.round(v)];
	
					i = i * 4;
					imgData.data[i+0] = c.r;
					imgData.data[i+1] = c.g;
					imgData.data[i+2] = c.b;
					imgData.data[i+3] = 255;
				}
			}
			
			eventBus.send("canvas:draw");
		};
		
		eventBus.listen("fractal:render", function(renderParameters) { 
			var canvasRect = eventBus.send("get:canvas:size");
			var FractalImpl = require("app/fractal_" + renderParameters.type);
			fractalImpl = new FractalImpl(renderParameters);
			var imgData = eventBus.send("get:canvas:imgData");
			var canvasToGraph = initGraph(renderParameters, canvasRect);
			var map1 = Color.createLinearGradientList(renderParameters.iterations/2, 0x444499, 0xBBBBBB);
			var map2 = Color.createLinearGradientList(renderParameters.iterations/2, 0xBBBBBB, 0xFFFFFF);
			var colorMap = map1.concat(map2);
			render(renderParameters, fractalImpl, imgData, canvasRect, canvasToGraph, colorMap);
		});
	};
	
	return Fractal;
});



