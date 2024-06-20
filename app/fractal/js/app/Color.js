
var Color = Color || { };

define([], function() { 
	
	var RGB = function(r,g,b) {
		if (arguments.length == 1 && typeof arguments[0] == 'number') {
			var hex = arguments[0];
			this.r = ( ( hex & 0xFF0000 ) >> 16 );
			this.g = ( ( hex & 0x00FF00 ) >> 8 );
			this.b = ( ( hex & 0x0000FF ) );
		}
		else {
			this.r = r;
			this.g = g;
			this.b = b;
		}
	};

	/*	linear interpolate 2 rgb values and return an rgb value 
		Accepts two rgb values and a percentage at which to interpolate
		the final value
	*/
	var interpolate = function(rgb1, rgb2, p) {
		return new RGB(
			 ( ((1 - p) * rgb1.r) + (p * rgb2.r) )
			,( ((1 - p) * rgb1.g) + (p * rgb2.g) )
			,( ((1 - p) * rgb1.b) + (p * rgb2.b) )
		);
	};
	
	var GradientEnumerator = function(numOfValues, c1, c2) { 
		this.numOfValues = numOfValues;
		this.c1 = new RGB(c1);
		this.c2 = new RGB(c2);
		this.current = -1;
		
		this.getNext = function() { 
			this.current++;
			var x = this.current;
			if (x >= this.numOfValues) {
				return null;
			}
			var p = x / (numOfValues - 1);
			var c = interpolate(this.c1, this.c2, p);
			return c;
		};
	};
	
	return { 
		rgb: RGB,
		
		/*	create an array of rgb values */
		createLinearGradientList : function(numOfValues, c1, c2) {
			
			var g = new GradientEnumerator(numOfValues, c1, c2);
			
			var c;
			var array = [];
			
			while ((c = g.getNext()) != null)
				array.push(c);
			
			return array;
		},
		
		createLinearGradient : function(imgData, x, y, width, height, c1, c2) { 
			var umax = width + x;
			var vmax = height + y;
			var c, i;
			
			var g = new GradientEnumerator(width, c1, c2);
			
			for (var u = x; u < umax; u++) {
				c = g.getNext();
				for (var v = y; v < vmax; v++) {
					i = (v * imgData.width + u) * 4;
					imgData.data[i+0] = c.r;
					imgData.data[i+1] = c.g;
					imgData.data[i+2] = c.b;
					imgData.data[i+3] = 0xFF;
				}
			}
		}
	};
});