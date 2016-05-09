// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = true, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }


// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = ["transOrange.png" , "stars.png", "text.png", "earth.gif", "crackedSoil.png", "copy.png" ];


function Robot(){
	this.pos = vec3();
	this.pos[0] = 20;
	this.pos[1] = 0;
	this.pos[2] = 0;
	
	this.holdingBucket = false;
}

function Bucket(){

	// constant
	this.fullLevel = 4;

	this.pos = vec3();
	this.pos[0] = -10;
	this.pos[1] = 0;
	this.pos[2] = 40;

	this.isCollectingWater = false;
	this.containingWater = false;
	this.waterLevel = 0;
	this.collisionRadius = 4;
}

var robot;
var bucket;


// camera
var CAMERA_FOLLOW_ROBOT = true;
// MODE
var MODE_UP = 0;
var MODE_DOWN = 1;
var MODE_RIGHT = 2;
var MODE_LEFT = 3;
var MODE_IDLE = 4;

var mode;	




// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 1, 0, 1 );			// Background color
		
		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );
		
		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		
		mode = MODE_IDLE;
		robot = new Robot();
		bucket = new Bucket();
		initRain();
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, -10,-100), perspective(50, canvas.width/canvas.height, .1, 200), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { CAMERA_FOLLOW_ROBOT = false;
										thrust[1] = -1; } );			shortcut.add( "Space", function() { CAMERA_FOLLOW_ROBOT = true;	
																											thrust[1] = 0;}, {'type':'keyup'} );
	
	shortcut.add( "w",     function() { mode = MODE_UP; } );			shortcut.add( "w",     function() { mode = MODE_IDLE; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { mode = MODE_LEFT } );			shortcut.add( "a",     function() { mode = MODE_IDLE; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { mode = MODE_DOWN; } );			shortcut.add( "s",     function() { mode = MODE_IDLE; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { mode = MODE_RIGHT; } );			shortcut.add( "d",     function() { mode = MODE_IDLE; }, {'type':'keyup'} );
	

	shortcut.add( "z",     function() { CAMERA_FOLLOW_ROBOT = false; thrust[1] =  1; } );			shortcut.add( "z",     function() { CAMERA_FOLLOW_ROBOT = true;	thrust[1] =  0; }, {'type':'keyup'} );
	// shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	// shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	// shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	// shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( "l",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 1, 0 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( "k",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, -1, 0 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( "o",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 1, 0, 0 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( "i",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, -1, 0, 0 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	//shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	//shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
															//			gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	//shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	//shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	//shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	//shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time ){

	if(CAMERA_FOLLOW_ROBOT){
		var eye = vec3();
		var at = vec3();
		var up = vec3();
		eye[0] = robot.pos[0];
		eye[1] = 15;
		eye[2] = 100;
		up[0] = 0;
		up[1] = 1;
		up[2] = 0;
		// lookAt( robot.pos, at, up );
		self.graphicsState.camera_transform = lookAt(eye, robot.pos, up);
	}else {
		var leeway = 70, border = 50;
		var degrees_per_frame = .0002 * animation_delta_time;
		var meters_per_frame  = .01 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}
}

// *******************************************************	


// Material

/* 
	Materials: Declare new ones as needed in every function.
	Parameters:
	1st: Color (4 floats in RGBA format), 
	2nd: Ambient light, 
	3rd: Diffuse reflectivity, 
	4th: Specular reflectivity, 
	5th: Smoothness exponent,
	6th: Texture image.
*/
var purplePlastic = new Material( vec4( .9,1,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
	greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
	bluePlastic = new Material( vec4( .0,.0,.9,1 ), .2, .4, .3, 30 ),
	earth 		= new Material( vec4( .7,.9,.5,1 ), .5, .1, .5, 10, "earth.gif" ),
	stars	 	= new Material( vec4( .5,.5,.5,1 ), .5,  1,  1, 40, "stars.png" ),
	rusty	 	= new Material( vec4( .7,.25,.05,1 ), .5, .1,  1, 10),
	soil 		= new Material( vec4( .7,.9,.5,1 ), .5, .1, .5, 10, "crackedSoil.png" ),
	water 		= new Material( vec4( .0,.0,.3,0.9), 1, .5,  0.1, 10 ),
	water 		= new Material( vec4( .0,.8,.8,0.9), 1, .5,  0.1, 10 ),
	
	bucketPlastic 		= new Material( vec4( 1 ,0.7,0,1 ), .8, .5, .8, 40, "transOrange.png" ),
	bucketPlasticInner 		= new Material( vec4( 1 ,0.7,0,1 ), .2, .5, .8, 40, "transOrange.png" );
	// bucketPlastic 		= new Material( vec4( 1,1,0,0.2 ), .5, .1, .5, 10, "transOrange.png" );
		

function m_bucket_draw(parent, model_transform){
	var stack = [];

	model_transform = mult(model_transform, translation(0,0.9,0));
	
	model_transform = mult(model_transform, scale(0.8,1,0.8));
	stack.push(model_transform);
	
	// bottom0
	model_transform = mult(model_transform, scale(3,0.2,3));
	parent.m_sphere.draw( parent.graphicsState, model_transform, bucketPlastic );


	// sides
	model_transform = stack.pop();
	stack.push(model_transform);

	var nSides = 15;
	var angle = 12;
	model_transform = mult(model_transform, rotation(180,0,1,0));
	model_transform = mult(model_transform, translation(0,2.5,0));
	stack.push(model_transform);
	stack.push(model_transform);

	
	model_transform = stack.pop();
	for(var i = 0; i != nSides; i++){
		model_transform = stack.pop();
		model_transform = mult(model_transform, rotation(angle,0,1,0));
		// stack.push(model_transform);



		// rim
		stack.push(model_transform);
		model_transform = mult(model_transform, translation(-4,2,0));

		model_transform = mult(model_transform, scale(.5,.5,1));
		parent.m_cylinder.draw( parent.graphicsState, model_transform, bucketPlastic );
		model_transform = stack.pop();
		stack.push(model_transform);

		// water
		if(bucket.containingWater){
			stack.push(model_transform);
				for (var j = 0; j != 5; j++) {	
					stack.push(model_transform);//parent.graphicsState.animation_time/1000)+
					model_transform = mult(model_transform, translation(  -0.55*j,0,0));
					model_transform = mult(model_transform, rotation(10,0,0,1));
					model_transform = mult(model_transform, translation(0,-2.5,0));
					// A cos(wt + phi)
					model_transform = mult(model_transform, translation(0,(.25* (Math.cos(5 * (parent.graphicsState.animation_time/5000) + i+j) + 1) ) + bucket.waterLevel/2,0));
					model_transform = mult(model_transform, scale(0.6, (.5* (Math.cos(5 * (parent.graphicsState.animation_time/5000) + i+j) + 1) ) + bucket.waterLevel ,0.8));
		
					parent.m_cube.draw( parent.graphicsState, model_transform, water );
					model_transform = stack.pop();
				}

			model_transform = stack.pop();
		}
				
		// sides
		stack.push(model_transform);
		model_transform = mult(model_transform, translation(-3,0,0));
		model_transform = mult(model_transform, rotation(10,0,0,1));
		model_transform = mult(model_transform, scale(1,5,1));
		parent.m_cube.draw( parent.graphicsState, model_transform, bucketPlastic );
		model_transform = stack.pop();

		model_transform = mult(model_transform, translation(-2.5,0,0));
		model_transform = mult(model_transform, rotation(10,0,0,1));
		model_transform = mult(model_transform, scale(0.05,5,1));
		parent.m_cube.draw( parent.graphicsState, model_transform, bucketPlasticInner );

	}


}
function drawRobot(parent, model_transform){
	var stack = [];
	stack.push(model_transform);

	var body_transform = model_transform;


	// set direction
	switch (mode){
		case MODE_RIGHT:
			robot.pos[0] += 1;
			body_transform = mult(body_transform, translation(robot.pos[0],robot.pos[1],robot.pos[2]));
			body_transform = mult(body_transform, rotation(90,0,1,0));
		break;
		case MODE_LEFT:
			robot.pos[0] -= 1;
			body_transform = mult(body_transform, translation(robot.pos[0],robot.pos[1],robot.pos[2]));
			body_transform = mult(body_transform, rotation(-90,0,1,0));

		break;
		case MODE_UP:
			robot.pos[2] -= 1;
			body_transform = mult(body_transform, translation(robot.pos[0],robot.pos[1],robot.pos[2]));
			body_transform = mult(body_transform, rotation(180,0,1,0));

		break;
		case MODE_DOWN:
			robot.pos[2] += 1;
			body_transform = mult(body_transform, translation(robot.pos[0],robot.pos[1],robot.pos[2]));
			body_transform = mult(body_transform, rotation(0,0,1,0));
		break;
		default:
			body_transform = mult(body_transform, translation(0,0.5,0));
			body_transform = mult(body_transform, translation(robot.pos[0],robot.pos[1],robot.pos[2]));
		break;
	}
	stack.push(body_transform);
	// find the side of the world Robot is in
	var material;
	if (robot.pos[0] < 0) {
		material = rusty;
	}else {
		material = greyPlastic;
	}

	// legs
	if (mode == MODE_IDLE){
		for(var RL = -1; RL <= 1; RL +=2){ 
			// stack.pop(); 
			body_transform = stack.pop();
			stack.push(body_transform);
			body_transform = mult(body_transform, translation(RL*2,+0.5,0));
			for(var i = 0; i != 3; i++){
				if(i)
					body_transform = mult(body_transform, translation(0,1+0.5 + 0.2*Math.sin(parent.graphicsState.animation_time/100),0));
				stack.push(body_transform);
				body_transform = mult(body_transform, scale(3,1,3));
				parent.m_cube.draw( parent.graphicsState, body_transform, material );
				body_transform = stack.pop();
			}
		}
	} else {	// walk mode
		for(var RL = -1; RL <= 1; RL +=2){
			body_transform = stack.pop();
			stack.push(body_transform);
			body_transform = mult(body_transform, translation(RL*2,3*(1.5+0.5 + 0.2*Math.sin(parent.graphicsState.animation_time/50)),0));
			for(var i = 0; i != 3; i++){	
				body_transform = mult(body_transform, rotation( 15*Math.sin(parent.graphicsState.animation_time/100), RL*1, 0, 0 ) );	
				stack.push(body_transform);
				body_transform = mult(body_transform, translation(0,-(i+1)*(1+0.5 + 0.2*Math.sin(parent.graphicsState.animation_time/100)),0));
			
				body_transform = mult(body_transform, scale(3,1,3));
				parent.m_cube.draw( parent.graphicsState, body_transform, material );
				body_transform = stack.pop();
			}
		}
		body_transform = stack.pop();
		body_transform = mult(body_transform, translation(2,2*(2+0.5 + 0.2*Math.sin(parent.graphicsState.animation_time/50)),0));
			
	}
	
	// butt
	// body_transform = model_transform;
	body_transform = mult(body_transform, translation(-2,1+0.5,0));
	stack.push(body_transform);
	body_transform = mult(body_transform, scale(7.5,2,4));
	parent.m_cube.draw( parent.graphicsState, body_transform, material );
	
	body_transform = stack.pop();
	
	// center is the torso box	
	body_transform = mult(body_transform, translation(0,4+1,0));
	stack.push(body_transform);
	body_transform = mult(body_transform, scale(10,8,8));
	parent.m_cube.draw( parent.graphicsState, body_transform, material );
	
	// arms
	body_transform = stack.pop();
	stack.push(body_transform);
	if (bucket.isCollectingWater){

		// adjust bucket position
		bucket.pos = vec3();
		bucket.pos[0] = robot.pos[0];
		bucket.pos[1] = robot.pos[1] + 8 + 0.5*Math.sin(parent.graphicsState.animation_time/100);
		bucket.pos[2] = robot.pos[2] + 10;

		for (var RL = -1; RL <= 1; RL+=2) {
			stack.push(body_transform);
			body_transform = mult(body_transform, translation(RL * (5+2),2,0));
			body_transform = mult(body_transform, rotation(-90,1,0,0));
			
			for (var i = 0; i != 4; i++) {
				body_transform = mult(body_transform, translation(0,-1.5,-0.5));
				// body_transform = mult(body_transform, translation(0,0.05*Math.sin(parent.graphicsState.animation_time/100),0));	
				stack.push(body_transform);
				body_transform = mult(body_transform, scale(2,1,2));
				parent.m_cube.draw( parent.graphicsState, body_transform, material );
				body_transform = stack.pop();
			}
			body_transform = stack.pop();
		}

	}
	else if (mode == MODE_IDLE){
		for (var RL = -1; RL <= 1; RL+=2) {
			stack.push(body_transform);
			body_transform = mult(body_transform, translation(RL * (5+2),2,0));
			for (var i = 0; i != 4; i++) {
				body_transform = mult(body_transform, translation(0,-1.5,0));
				body_transform = mult(body_transform, translation(0,0.05*Math.sin(parent.graphicsState.animation_time/100),0));	
				stack.push(body_transform);
				body_transform = mult(body_transform, scale(2,1,2));
				parent.m_cube.draw( parent.graphicsState, body_transform, material );
				body_transform = stack.pop();
			}
			body_transform = stack.pop();
		}
	} else {	// walking mode, sway arms
		for (var RL = -1; RL <= 1; RL+=2) {
			stack.push(body_transform);
			body_transform = mult(body_transform, translation(RL * (5+2),2,0));
			for (var i = 0; i != 4; i++) {
				body_transform = mult(body_transform, rotation( 15*Math.sin(parent.graphicsState.animation_time/100), -RL*1, 0, 0 ) );	
				body_transform = mult(body_transform, translation(0,-1.5,0));
				body_transform = mult(body_transform, translation(0,0.05*Math.sin(parent.graphicsState.animation_time/100),0));	
				stack.push(body_transform);
				body_transform = mult(body_transform, scale(2,1,2));
				parent.m_cube.draw( parent.graphicsState, body_transform, material );
				body_transform = stack.pop();
			}
			body_transform = stack.pop();
		}
	}

	// head
	body_transform = stack.pop();
	body_transform = mult(body_transform, translation(0,4+3,0));
	body_transform = mult(body_transform, scale(6,4,4));
	parent.m_cube.draw( parent.graphicsState, body_transform, material );
	
}

// RAIN

var rainRangeStart = [-100, 80,-50] ;
var rainRangeDis = [100,80,100];
var rainAmount = 100;
var Rain = [];

function RainDrop (){
	this.pos = vec3();
	this.falling = false;
}
function initRain(){
	for (var i = 0; i != rainAmount; i++){
		Rain.push(new RainDrop());
	}
}

function m_rain_draw(parent, model_transform){
	var stack = [];
	model_transform = mult(model_transform, scale(0.5,0.5,0.5));
	model_transform = mult(model_transform, rotation(-90,1,0,0));	
	stack.push(model_transform);
	model_transform = mult(model_transform, translation(0,0,-1));
	model_transform = mult(model_transform, scale(1,1,1));
	parent.m_sphere.draw( parent.graphicsState, model_transform, water );
	model_transform = stack.pop();

	model_transform = mult(model_transform, translation(0,0,.1));
	model_transform = mult(model_transform, scale(1,1,0.9));
	parent.m_fan.draw( parent.graphicsState, model_transform, water );
}

function drawRain(parent,animate){
	for ( var i = 0; i != rainAmount; i++){
		if ( animate ){
			if ( Rain[i].falling){
					// bucket collision detection
					if (length(subtract(Rain[i].pos, bucket.pos)) < bucket.collisionRadius){
						if (bucket.isCollectingWater){
							if(bucket.containingWater)	bucket.waterLevel = (bucket.waterLevel == bucket.fullLevel) ? bucket.waterLevel : bucket.waterLevel + 0.5;
							else bucket.containingWater = true;
						}
						Rain[i].falling = false;
					}
					else if (Rain[i].pos[1] <= 0 ){		// if hit the ground
						Rain[i].falling = false;
					} else {
						Rain[i].pos[1] -= 1;
						var rain_transform = mult(mat4(), translation(Rain[i].pos[0], Rain[i].pos[1], Rain[i].pos[2]));
						m_rain_draw(parent, rain_transform);
					}

			} else {
				// randomly decide if the we wanna drop a rain
				if(Math.random() > 0.99){
					// decide x pos
					// Rain[i].pos[0] = bucket.pos[0]+3;
					// Rain[i].pos[2] = bucket.pos[2];
					Rain[i].pos[0] = rainRangeStart[0] + Math.floor((Math.random() * (rainRangeDis[0]) + 1));
					Rain[i].pos[2] = rainRangeStart[2] + Math.floor((Math.random() * (rainRangeDis[2]) + 1));
					Rain[i].pos[1] = rainRangeStart[1];
					Rain[i].falling = true;
					var rain_transform = mult(mat4(), translation(Rain[i].pos[0], Rain[i].pos[1], Rain[i].pos[2]));
					rain_transform = mult(rain_transform, scale(1,1,1));
					parent.m_cube.draw( parent.graphicsState, rain_transform, bluePlastic );
				}
				
			}
		} else {
			if ( Rain[i].falling){
				var rain_transform = mult(mat4(), translation(Rain[i].pos[0], Rain[i].pos[1], Rain[i].pos[2]));
				m_rain_draw(parent, rain_transform);
			}
		}
		
	}
}
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );
		



		this.basis_id = 0;
		var mtStack = [];
		var model_transform = mat4();
		mtStack.push(model_transform);
		/**********************************
		Start coding here!!!!
		**********************************/

		// plane
		model_transform = mtStack.pop();
		mtStack.push(model_transform);
		model_transform = mult(model_transform, scale(1000,1,1000));
		this.m_cube.draw( this.graphicsState, model_transform, soil );

		// wall
		model_transform = mtStack.pop();
		mtStack.push(model_transform);
		model_transform = mult(model_transform, translation(0,+50,-50));
		model_transform = mult(model_transform, scale(5,100,100));
		this.m_cube.draw( this.graphicsState, model_transform, purplePlastic );

		// rain drops
		model_transform = mtStack.pop();
		mtStack.push(model_transform);
		drawRain(this,animate);

		// robot
		model_transform = mtStack.pop();
		mtStack.push(model_transform);
		drawRobot(this, model_transform);

		// bucket
		model_transform = mtStack.pop();
		mtStack.push(model_transform);

		model_transform = mult(model_transform, translation(bucket.pos[0], bucket.pos[1], bucket.pos[2]));
		m_bucket_draw(this, model_transform);

		model_transform = mtStack.pop();

		// check collision of robot and bucket
		if (!bucket.isCollectingWater){
			if(length(subtract(robot.pos, bucket.pos)) < bucket.collisionRadius+5){
				bucket.isCollectingWater = true;
			}
		}
/*
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform); 
		model_transform = mult( model_transform, translation( 0, -2, 0 ) );		

		
		model_transform = mult( model_transform, translation( 0, -4, 0 ) );
		this.m_cylinder.draw( this.graphicsState, model_transform, greyPlastic );	
		model_transform = mult( model_transform, rotation( this.graphicsState.animation_time/20, 0, 1, 0 ) );	
		model_transform = mult( model_transform, scale( 10, 1, 5 ) );											
		this.m_sphere.draw( this.graphicsState, model_transform, earth );		
		this.m_strip.draw( this.graphicsState, model_transform, stars );
		this.m_sphere.draw( this.graphicsState, model_transform, bluePlastic );	
		this.m_fan.draw( this.graphicsState, model_transform, greyPlastic );	
		this.m_cube.draw( this.graphicsState, model_transform, powerpuff );
*/	


	
	}	

Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	// debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	// debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_strings.string_map["Robot"] = "Robot: (" + robot.pos[0] + ", " + robot.pos[1] + ", " + robot.pos[2] + ")";

	debug_screen_strings.string_map["Bucket"] = "Bucket: (" + bucket.pos[0] + ", " + bucket.pos[1] + ", " + bucket.pos[2] + ")";

}
