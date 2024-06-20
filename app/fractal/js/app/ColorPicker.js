
(function($) { 

	$.createGradientBar = function(el) { 
		var cnvs = document.createElement("canvas");
		el.appendChild(cnvs);
		
		cnvs.width = 640;
		cnvs.height = 80;
		
		var ctx = cnvs.getContext("2d");
		var imgData = ctx.createImageData(cnvs.width, cnvs.height);
		var pixel;
		
		var c1 = 0xFFFF00;
		var c2 = 0x00FFFF;
		var c3 = 0xFF00FF;
		
		Color.createLinearGradient(imgData, 20, 1, 300, 10, c1, c2);
		Color.createLinearGradient(imgData, 320, 1, 300, 10, c2, c3);

		ctx.putImageData(imgData,0,0);
		delete imgData;
		delete ctx; 
	};
	
	var updateColorInGradientHandle = function(imgData, color) { 
	
	};
	
	var primaries = [
		Color.rgb(0xFF0000), 
		Color.rgb(0xFFFF00), 
		Color.rgb(0x00FF00), 
		Color.rgb(0x00FFFF), 
		Color.rgb(0x0000FF), 
		Color.rgb(0xFF00FF), 
		Color.rgb(0xFF0000)
	];
	
	var createColorDiscImageData = function(canvas, diameterOuter, diameterInner) { 
		var ctx = canvas.getContext("2d");
		var w = diameterOuter;
		var radiusOuter = diameterOuter / 2;
		var radiusInner = diameterInner / 2;
		var data = ctx.createImageData(w, h);
		var sixthOfPie = Math.PI / 3;
		for (var i = 0; i < w; i++) {
			for (var j = 0; j < h; j++) {
				var x = i - radiusOuter;
				var y = -(j - radiusOuter);
				var radius = Math.sqrt(x*x + Y*y);
				var dataIndex = x * y * 4;
				if (radius >= radiusInner && radius <= radiusOuter) {
					var radians = Math.atan2(x, y);
					data[dataIndex] = 0;
					data[dataIndex + 1] = 0;
					data[dataIndex + 2] = 0;
					data[dataIndex + 3] = 0xFF;
				} else {
					data[dataIndex] = 0;
					data[dataIndex + 1] = 0;
					data[dataIndex + 2] = 0;
					data[dataIndex + 3] = 0;
				}
			}
		}
		delete ctx;
		return data;
	};

})(window);

