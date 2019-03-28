
var f = (function(){
	var m  = [0.146, 0.062];
	var l  = [0.2425, 0.1];
	var L  = 0.52;
	var I  = [m[0]*Math.pow(l[0],2)/3, m[1]*Math.pow(l[1],2)/3];
	var J  = 0.2591;
	var De = [0.0568*2*(I[0]+m[0]*l[0]*l[0]),0.2419*2*(I[1]+m[1]*l[1]*l[1])];
	var Dm = 34.9351;
	var g  = 9.81;

	return (function(t,x,u){
		var th    = [x[0],x[2]];
		var dth   = [x[1],x[3]];
		var phi   = x[4];
		var dphi  = x[5];
	    var ddphi = u;
	    var dx    = [0,0,0,0,0,0];


	    if(Math.abs(dphi)>10){
	    	// speed limitter
	    	var ov = Math.atan(Math.abs(dphi)-10)/(Math.PI/2);
	    	ddphi=  ov*(-10*dphi) + (1-ov)*ddphi;
	    }

	    for(k=0;k<2;k++){
			dx[2*k]   = dth[k];
			dx[2*k+1] = Math.sin(th[k])*Math.cos(th[k])*dphi*dphi+(m[k]*l[k]*L*Math.cos(th[k])*ddphi+m[k]*g*l[k]*Math.sin(th[k])-De[k]*dth[k])/(m[k]*l[k]*l[k]+I[k]);
	    }
	    dx[4] = dphi;
	    dx[5] = ddphi;

	    return dx;
	});
})();
