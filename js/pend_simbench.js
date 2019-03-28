
$(document).ready(function () {

	const arm_length = 0.51;
	const pend1_length = 0.2425;  // length to center of mass
	const pend2_length = 0.1075;


	const pend_sx = 0.018;
	const pend_sy = 0.018;
	const pend_gap = 0.005;
	const arm_sz = 0.02;
	const arm_sy = 0.04;
	const arm_sx = 2 * (arm_length - pend_sx / 2 - pend_gap);

	const pend1_sz = pend1_length * 2 + pend_sx;
	const pend2_sz = pend2_length * 2 + pend_sx;
	const pivot_height = 0.05; // Distance from the arm height to the center of rotation of the pendulum

	const board_sx = 0.3;
	const board_sy = 0.3;
	const board_sz = 0.01;


	let hash = window.location.hash.substr(1);
	let opts = hash.split('&').reduce(function (result, item) {
		let parts = item.split('=');
		result[parts[0]] = parts[1];
		return result;
	}, {});

	let scene = new THREE.Scene();
	let camera = new THREE.PerspectiveCamera(('fov' in opts) ? opts['fov'] : 30, window.innerWidth / window.innerHeight, 0.1, 20);
	let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	let container = $('body');
	let isMouseEnter = false;
	let controls = { manual: false };
	let mouse = new THREE.Vector2();
	
	let resizeCanvas = function () {
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}
	document.body.append(renderer.domElement);
	resizeCanvas();
	let mat_highlight = new THREE.MeshToonMaterial({
		color: 0xff0000,
		transparent: true,
		opacity: 0.3,
		polygonOffset: true,
		polygonOffsetFactor: 2, // positive value pushes polygon further away
		polygonOffsetUnits: 1
	});
	let mat_wire = new THREE.LineBasicMaterial({ color: 0x426579, linewidth: 1 });

	let mat_body = new THREE.MeshToonMaterial({
		color: 0xffffff,
		polygonOffset: true,
		polygonOffsetFactor: 2, // positive value pushes polygon further away
		polygonOffsetUnits: 1
	});

	let mat_pend = new THREE.MeshToonMaterial({
		color: 0x426579,
		transparent: true,
		opacity: 0.3,
		polygonOffset: true,
		polygonOffsetFactor: 2, // positive value pushes polygon further away
		polygonOffsetUnits: 1
	});

	function add_wire(mesh) {
		let geo = new THREE.EdgesGeometry(mesh.geometry); // or WireframeGeometry
		let wireframe = new THREE.LineSegments(geo, mat_wire);
		mesh.add(wireframe);
	}


	let geo;
	geo = new THREE.CubeGeometry(arm_sx, arm_sy, arm_sz);
	let arm = new THREE.Mesh(geo, mat_body);
	scene.add(arm);
	add_wire(arm);

	let logo_geometry = new THREE.PlaneGeometry(arm_sx, arm_sz);
	logo_geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, arm_sy / 2));
	let texture = new THREE.TextureLoader().load('./textures/logo.png');
	// workaround for safari texture problem
	// https://github.com/mrdoob/three.js/issues/1338
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1, 1);
	let logo_material = new THREE.MeshBasicMaterial({transparent:true, side: THREE.DoubleSide, map: texture })
	let logo = new THREE.Mesh(logo_geometry, logo_material);
	logo.rotation.x = Math.PI / 2;
	logo.rotation.order = "ZXY";
	scene.add(logo);

	geo = new THREE.CubeGeometry(board_sx, board_sy, board_sz);
	let board = new THREE.Mesh(geo, mat_body);
	board.position.z = -arm_sz / 2 - board_sz / 2 - 0.02;
	scene.add(board);
	add_wire(board);

	const motor_rad = 0.05;
	const motor_upper_height = 0.02;
	geo = new THREE.CylinderGeometry(motor_rad, motor_rad, motor_upper_height - arm_sz / 2, 10);
	let motor_upper = new THREE.Mesh(geo, mat_body);
	motor_upper.position.z = -motor_upper_height / 2 - arm_sz / 2;
	motor_upper.rotation.x = Math.PI / 2;
	motor_upper.rotation.order = "ZXY";
	scene.add(motor_upper);
	add_wire(motor_upper);

	const motor_lower_height = 0.1;
	geo = new THREE.CylinderGeometry(motor_rad, motor_rad, motor_lower_height, 10);
	let motor_lower = new THREE.Mesh(geo, mat_body);
	motor_lower.position.z = -motor_lower_height / 2 - arm_sz / 2 - board_sz - 0.02;
	motor_lower.rotation.x = Math.PI / 2;
	scene.add(motor_lower);
	add_wire(motor_lower);

	const text_scale=0.16;
	var drag_geometry = new THREE.PlaneGeometry(2*text_scale, 1* text_scale);
	var drag_geometry_r = new THREE.PlaneGeometry(2* text_scale, 1* text_scale);
	drag_geometry_r.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI));
	var drag_texture = new THREE.TextureLoader().load('./textures/drag.png');
	var drag_texture_r = new THREE.TextureLoader().load('./textures/drag_r.png');
	// workaround for safari texture problem
	// https://github.com/mrdoob/three.js/issues/1338
	drag_texture.wrapS = drag_texture.wrapT = THREE.RepeatWrapping;
	drag_texture.repeat.set(1, 1);
	var drag_material = new THREE.MeshBasicMaterial({ transparent:true, map: drag_texture })
	var drag_material_r = new THREE.MeshBasicMaterial({ transparent:true, map: drag_texture_r })
	let drag = new THREE.Object3D();
	drag.rotation.x = Math.PI / 2;
	drag.rotation.order = "ZXY";
	drag.position.z = +0.1;
	scene.add(drag);
	var drag_mesh = new THREE.Mesh(drag_geometry, drag_material);
	var drag_mesh_r = new THREE.Mesh(drag_geometry_r, drag_material_r);
	drag.add(drag_mesh);
	drag.add(drag_mesh_r);

	pillar_rad = 0.02;
	pillar_height = 0.5 + 0.045;
	board_rad = Math.sqrt((board_sx - pillar_rad) * (board_sx - pillar_rad) + (board_sy - pillar_rad) * (board_sy - pillar_rad)) / 2;

	for (k = 0; k < 4; k++) {
		let g = new THREE.CylinderGeometry(pillar_rad, pillar_rad, pillar_height - arm_sz / 2, 6);
		let pillar = new THREE.Mesh(g, mat_body);
		pillar.position.x = (board_rad - pillar_rad - 0.005) * Math.cos(Math.PI * (1 / 4 + 1 / 2 * k));
		pillar.position.y = (board_rad - pillar_rad - 0.005) * Math.sin(Math.PI * (1 / 4 + 1 / 2 * k));
		pillar.position.z = board.position.z - board_sz / 2 - pillar_height / 2;
		pillar.rotation.x = Math.PI / 2;
		scene.add(pillar);
		add_wire(pillar);
	}

	const pillar_z = board.position.z - board_sz / 2 - pillar_height / 2;

	const base_sx = 0.5;
	const base_sy = 0.5;
	const base_sz = 0.03;
	geo = new THREE.CubeGeometry(base_sx, base_sy, base_sz);
	let base = new THREE.Mesh(geo, mat_body);
	base.position.z = pillar_z - pillar_height / 2 - base_sz / 2;
	scene.add(base);
	add_wire(base);


	let enc_rad = 0.03;
	let enc_height = 0.04;

	let enc_plate_sy = arm_sy;
	let enc_plate_sx = 0.01;
	let enc_plate_height = pivot_height - arm_sz / 2 + enc_rad;

	geo = new THREE.CylinderGeometry(enc_rad, enc_rad, enc_height, 10);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation(0, -(arm_sx / 2 - enc_plate_sx - enc_height / 2), pivot_height));
	let enc1 = new THREE.Mesh(geo, mat_body);
	scene.add(enc1);
	add_wire(enc1);

	geo = new THREE.CylinderGeometry(enc_rad, enc_rad, enc_height, 10);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation(0, -(arm_sx / 2 - enc_plate_sx - enc_height / 2), pivot_height));
	let enc2 = new THREE.Mesh(geo, mat_body);
	scene.add(enc2);
	add_wire(enc2);

	geo = new THREE.CubeGeometry(enc_plate_sx, enc_plate_sy, enc_plate_height);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation((arm_sx / 2 - enc_plate_sx / 2), 0, arm_sz / 2 + enc_plate_height / 2));
	let enc1_plate = new THREE.Mesh(geo, mat_body);
	scene.add(enc1_plate);
	add_wire(enc1_plate);

	geo = new THREE.CubeGeometry(enc_plate_sx, enc_plate_sy, enc_plate_height);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation(-(arm_sx / 2 - enc_plate_sx / 2), 0, arm_sz / 2 + enc_plate_height / 2));
	let enc2_plate = new THREE.Mesh(geo, mat_body);
	scene.add(enc2_plate);
	add_wire(enc2_plate);

	geo = new THREE.CubeGeometry(pend_sx, pend_sy, pend1_sz);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation(arm_length, 0, pend1_length));
	let pend1 = new THREE.Mesh(geo, mat_pend);
	pend1.position.z = pivot_height;
	pend1.rotation.order = "ZXY";
	scene.add(pend1);
	add_wire(pend1);

	geo = new THREE.CubeGeometry(pend_sx, pend_sy, pend2_sz);
	geo.applyMatrix(new THREE.Matrix4().makeTranslation(arm_length, 0, pend2_length));
	let pend2 = new THREE.Mesh(geo, mat_pend);
	pend2.position.z = pivot_height;
	pend2.rotation.order = "ZXY";
	scene.add(pend2);
	add_wire(pend2);

	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('orientationchange', onWindowResize, false);
	container.mousemove(onMouseMove);
	container.mousedown(onMouseDown);
	container.mouseup(onMouseUp);
	container.mouseenter(onMouseEnter);
	container.mouseleave(onMouseLeave);


	camera.position.z = ('z' in opts) ? opts['z'] : 0.3;
	camera.position.y = ('y' in opts) ? opts['y'] : -2.6;
	camera.position.x = ('x' in opts) ? opts['x'] : 0.5;
	camera.up = new THREE.Vector3(0, 0, 1);
	camera.lookAt(new THREE.Vector3(
		('ax' in opts) ? opts['ax'] : 0,
		('ay' in opts) ? opts['ay'] : 0,
		('az' in opts) ? opts['az'] : 0));

	let light = new THREE.PointLight(0xeeeeee);
	light.position.set(4, -0.8, 4);
	scene.add(light);
	let ambientLight = new THREE.AmbientLight(0x444444);
	scene.add(ambientLight);

	let phi = 0, theta1 = 0, theta2 = 0;
	let x;
	init_x();
	set_dynamic_object_positions(phi, theta1, theta2);
	let clock = new THREE.Clock();
	clock.start();
	let t = 0;
	let controller = { u: (function (t, x) { return 0; }) };
	let r = 0;
	
	var animate = function () {
		requestAnimationFrame(animate);
		var dt = clock.getDelta();
		if (dt <= 0 || dt >= 0.1) dt = 0.1;
		t += dt;

		if (controller.reset == true) {
			let r_new = Math.random() * Math.PI * 2;
			x[4] += r_new - r;
			r = r_new;
			controller.reset = false;
		}
		if (controls.manual == false) {
			controller = gen_controller(t, x, controller);
		} else {
			controller = {
				mode: 'manual',
				tmc: 0,
				u: (function (t, x) {
					return 1000 * ((mouse.x - controls.centerc) * Math.PI - (x[4] - controls.center)) - 100 * x[5];
				})
			};
		}

		if (controls.manual == false && isMouseEnter == true) {
			drag.visible = true;
		} else {
			drag.visible = false;
		}
		var sol = numeric.dopri(0, dt, x, function (ts, y) { return f(t + ts, y, controller.u(t + ts, y)); });
		x = sol.at(dt);
		if (numeric.any(numeric.isNaN(x))) {
			init_x();
		}
		if (controls.manual == false) {
			x[4] -= Math.round(x[4] / (2 * Math.PI)) * (2 * Math.PI);
		}
		x[0] -= Math.round(x[0] / (2 * Math.PI)) * (2 * Math.PI);
		x[2] -= Math.round(x[2] / (2 * Math.PI)) * (2 * Math.PI);

		set_dynamic_object_positions(x[4] - r, x[0], x[2]);
		drag.rotation.z = 2 * t;
		renderer.render(scene, camera);
	};

	animate();

	function init_x() {
		x = [2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random(), 4 * Math.random() - 2];
	}

	function set_dynamic_object_positions(phi, theta1, theta2) {
		arm.rotation.z = phi;
		logo.rotation.z = phi + Math.PI;
		motor_upper.rotation.z = phi;

		enc1.rotation.z = Math.PI / 2 + phi;
		enc2.rotation.z = Math.PI / 2 + phi + Math.PI;

		enc1_plate.rotation.z = phi;

		enc2_plate.rotation.z = phi;

		pend1.rotation.z = phi;
		pend1.rotation.x = theta1;

		pend2.rotation.z = phi + Math.PI;
		pend2.rotation.x = theta2;

	}

	const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	function onWindowResize() {
		if(!iOS){
			resizeCanvas();
		}
	}

	function onMouseMove(event) {

		event.preventDefault();

		mouse.x = ((event.clientX - container.offset().left) / container.width()) * 2 - 1;
		mouse.y = ((event.clientY - container.offset().top) / container.height()) * 2 - 1;
	}

	function onMouseEnter(event) {
		isMouseEnter = true;
	}

	function onMouseLeave(event) {
		isMouseEnter = false;
	}

	function onMouseDown(event) {
		event.preventDefault();
		controls.manual = true;
		controls.center = x[4];
		controls.centerc = ((event.clientX - container.offset().left) / container.width()) * 2 - 1;
		container.css("cursor", "ew-resize");
		motor_lower.material = mat_highlight;
		motor_upper.material = mat_highlight;
	}

	function onMouseUp(event) {
		event.preventDefault();
		controls.manual = false;
		motor_lower.material = mat_body;
		motor_upper.material = mat_body;
		container.css("cursor", "pointer");
	}
});
