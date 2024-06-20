
define(["app/complex"], function(Complex) {
	
	var fractalImpl = function(renderParameters) {

		var constant = new Complex(renderParameters.constant_a, 
									renderParameters.constant_b);

		var iterate = function(graphPoint, iterations) { 
			var i = 0;
			var m = 0;
			var z = graphPoint;
			var c = constant;
			for (; i < iterations; i++) {
				m = z.modulus();
				if (m > 2) break;
				z.square().add(c);
			}
			
			return iterations == i ? -1 : i;
		};
		
		this.iterate = function(z, iterations) { 
			return iterate(z, iterations);
		};
	};
	
	return fractalImpl;
	
});
