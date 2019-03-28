var gen_controller=(function(){

	// model parameters from the experiment by K. Kamo (2014)
	var m  = [0.146, 0.062];
	var l  = [0.2425, 0.1];
	var L  = 0.52;
	var I  = [m[0]*Math.pow(l[0],2)/3, m[1]*Math.pow(l[1],2)/3];
	var J  = 0.2591;
	var De = [0.0568*2*(I[0]+m[0]*l[0]*l[0]),0.2419*2*(I[1]+m[1]*l[1]*l[1])];
	var Dm = 34.9351;
	var g  = 9.81;

	// feedback gains (from students' experiment)
	var K1=[-58,-10.4,0,0,2.2,3.1]; // N. Ikenishi (2013)
	var K2=[400,71.7,-321,-38.0,-8.17,-9.15]; // K. Sugiyama (2012)

	// step by step swing up controller
	// designed in leisure hours of I. Maruta (2014)
	var controller_array={
		'wait':
			(function(t,x){
				return -15 * ( Math.sin(x[0]) > 0 ? 1 : -1 )
					-10*x[5]-1.5*x[4];
			}),
		'swing-down':
			(function(t,x){
					return 0.1*Math.sin(t)-x[5];
			}),
		'1st-swing-up':
			(function(t,x){
				return 15 * ( Math.sin(x[0]) > 0 ? 1 : -1 )
					-10*x[5]-1.5*x[4];
			}),
		'1st-stabilize':
			(function(t,x){
				return numeric.dot(K1,x);
	     	}),
		'2nd-swing-up':
			(function(t,x){
				return numeric.dot(K1,x)
				 + 4 * ( Math.sin(x[2]) > 0 ? 1 : -1 );
	     	}),
		'final-stabilization':
			(function(t,x){
				return numeric.dot(K2,x);
			})
	};

	var parE = function(k,x){
		// calculate partial energy of k-th pendulum
		return 0.5*m[k]*(l[k]*x[k*2+1])*(l[k]*x[k*2+1])+0.5*I[k]*x[k*2+1]*x[k*2+1]+m[k]*g*l[k]*Math.cos(x[k*2]);
	}
	return (function(ts,x,old_controller){
		var controller = old_controller;
		if(controller.mode==undefined){
			change_mode('swing-down');
		}

		var new_mode;
		if(parE(0,x) < 1.5*parE(0,[0,0,0,0])){
			if(Math.abs(x[0])<0.5 ){
				if(parE(1,x) < 1.1*parE(1,[0,0,0,0])){
					if(Math.abs(x[2])<0.5){
						new_mode='final-stabilization';
					}else{
						new_mode='2nd-swing-up';					
					}
				}else{
					new_mode='1st-stabilize';					
				} 
			}else{
				new_mode='1st-swing-up';
			}
		}else{
			new_mode='wait';
		}

		if(controller.mode == 'swing-down'){
			// swing-down mode must sustain several seconds
			if( ts - controller.tmc > 3){
				change_mode(new_mode);
			}
		}else if(new_mode != controller.mode && ts-controller.tmc > 0.2){
			// prevent too fast mode switching
			change_mode(new_mode);
		}

		// since stabilized pendulum is boring 
		// swing-down the pendulums
		if(controller.mode == 'final-stabilization' && (ts-controller.tmc)>5){
			change_mode('swing-down');
			controller.reset = true;
		} 

		controller.u = controller_array[controller.mode];
		return controller;

		function change_mode(new_mode){
			controller.mode = new_mode;
			controller.tmc = ts;
		}
	});
})();