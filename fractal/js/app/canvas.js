
define(["jquery"], function($){
	
	var canvas = function(eventBus) { 
		
		var canvas;
		var ctx;
		var imgData;
		var mouseDown;
		var mouseDownPoint;
		var selectionBox;
		var canvasToGraph;
		
		var jqCanvas = $("#fractalCanvas");
		
		var drawScreen = function() { 
			ctx.putImageData(imgData, 0, 0);
			if (mouseDown && selectionBox) { 
				ctx.strokeStyle = 'Red';
				ctx.lineWidth = "2";
				
				ctx.beginPath();
				ctx.rect(selectionBox.x, selectionBox.y, selectionBox.w, selectionBox.h);
				ctx.stroke();
				
				ctx.beginPath();
				ctx.moveTo(selectionBox.c1.x, selectionBox.c1.y);
				ctx.lineTo(selectionBox.c2.x, selectionBox.c2.y);
				ctx.stroke();
				
				ctx.beginPath();
				ctx.moveTo(selectionBox.c3.x, selectionBox.c3.y);
				ctx.lineTo(selectionBox.c4.x, selectionBox.c4.y);
				ctx.stroke();
			};
		};
		
		var createSelectionBox = function(p1, p2) { 
			var w = Math.abs(p1.x - p2.x);
			var h = Math.abs(p1.y - p2.y);
			var x = Math.min(p1.x, p2.x);
			var y = Math.min(p1.y, p2.y);
			var cx = x + w / 2;
			var cy = y + h / 2;
			var c1x = cx;
			var c1y = cy - 5;
			var c2x = cx;
			var c2y = cy + 5;
			var c3x = cx - 5;
			var c3y = cy;
			var c4x = cx + 5;
			var c4y = cy;
			return { 
				x:x, 
				y:y, 
				w:w, 
				h:h, 
				c1: { x: c1x, y: c1y }, 
				c2: { x: c2x, y: c2y },
				c3: { x: c3x, y: c3y },
				c4: { x: c4x, y: c4y } 
			};
		};
		
		// define as a function in case we want to reinitialize after creation
		var init = function(width, height) { 
			canvas = jqCanvas[0];
			
			if (width) canvas.width = width;
			else canvas.width = window.innerWidth;
			
			if (height) canvas.height = height;
			else canvas.height = window.innerHeight;

			ctx = canvas.getContext("2d");
			
			imgData = ctx.createImageData(canvas.width, canvas.height);
		};
		
		jqCanvas.on("mouseup", function(e) { 
			mouseDown = false;
			if (selectionBox) {
				eventBus.send("canvas:selectionCreated", selectionBox);
				selectionBox = null;
			}
		});
		
		jqCanvas.on("mousedown", function(e) { 
			mouseDown = true;
			mouseDownPoint = { x: e.clientX, y: e.clientY };
			selectionBox = null;
			drawScreen();
		});
		
		jqCanvas.on("mousemove", function(e) {
			if (!canvasToGraph) return;
			var p2 = canvasToGraph.transform(e.clientX, e.clientY);
			if (mouseDown) { 
			var p1 = canvasToGraph.transform(mouseDownPoint.x, mouseDownPoint.y);
			var x = Math.min(p1.x, p2.x);
			var y = Math.max(p1.y, p2.y);
			selectionBox = createSelectionBox(mouseDownPoint, { x: e.clientX, y: e.clientY });
				drawScreen();
				var rect = {x:x,y:y,w:Math.abs(p2.x-p1.x),h:Math.abs(p2.y-p1.y)};
				eventBus.send("set:menu:dimension",rect);
			}
			var pos = {canvasX: e.clientX, canvasY: e.clientY, graphX: p2.x, graphY: p2.y};
			eventBus.send("set:menu:mouseposition", pos);
		});
		
		eventBus.listen("get:canvas:size", function() { 
			return { x: 0, y: 0, w: canvas.width, h: canvas.height };
		});
		
		eventBus.listen("get:canvas:imgData", function() { 
			return imgData;
		});
		
		eventBus.listen("canvas:init", function() { 
			init();
		});
		
		eventBus.listen("canvas:draw", function() { 
			drawScreen();
		});

		eventBus.listen("set:canvas:graphTransform", function(transformer){
			canvasToGraph = transformer;
		});
		
		// init during constructor call
		init();
	};
	
	return canvas;
	
});
