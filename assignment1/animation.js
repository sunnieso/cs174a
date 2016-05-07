// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }


// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "text.png" ];

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
		
		gl.clearColor( 0, 0.1, 0.8, .4 );			// Background color
		
		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );
		
		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, -15,-50), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here

Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult(  self.graphicsState.camera_transform,rotation( 3, 1, 0, 0 ) ); }; } ) (this) ) ;
	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	// shortcut.add( "ALT+c", function() { })
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}


function update_camera( self, animation_delta_time )
	{
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

// helper functions
function draw_leg(parent, model_transform, kthLeg, material, RorL){
	var leg_len = 1.4;
	var leg_wid = .5;
	var separation = 0.8;
	var trans;
	// upper sector
	trans = mat4();
	trans = mult( trans, model_transform);
	trans = mult( trans, translation( 0, -1.25, RorL*separation ));
	trans = mult( trans, rotation(RorL*(10*Math.sin(parent.graphicsState.animation_time/100)-20), 1, 0, 0) );
	trans = mult( trans, translation( 0, -leg_len/2, RorL*separation ));
	trans = mult( trans, translation(kthLeg*2, 0, 0));
	model_transform = trans;
	trans = mult( trans, scale( leg_wid,leg_len,leg_wid ));
	parent.m_cube.draw( parent.graphicsState, trans, material );
	// // lower sector
	model_transform = mult( model_transform, translation(0, -leg_len/2, RorL*leg_wid/2));
	model_transform = mult( model_transform, rotation(RorL*(30*Math.sin(parent.graphicsState.animation_time/100)+40), 1, 0, 0) );
	model_transform = mult( model_transform, translation(0, -leg_len/2, -RorL*leg_wid/2));
	model_transform = mult( model_transform, scale(leg_wid,leg_len,leg_wid));
	parent.m_cube.draw( parent.graphicsState, model_transform, material );
		
}

// eight pieces and flower
function draw_flower(parent, model_transform){

	var stack = [];
	
	var green = new Material( vec4(0,1,0,1),.5,.1,.1,40),
		red = new Material( vec4( .7,.3,0,1 ), 1, .1, .1, 50);

	var radius = 6;
	var del_h = 2.5;
	var height = -del_h+0.5;
	var nTrunks = 8;
	model_transform = mat4();
	model_transform = mult( model_transform, translation(0,height,0));
	for (var i = 0 ; i != nTrunks; i++) {
		model_transform = mult( model_transform, translation(0,del_h,0));
		model_transform = mult( model_transform, rotation(radius*Math.sin(parent.graphicsState.animation_time/2000),0,0,1));
		stack.push(model_transform);
	}

	// flower
	var flower_radius = 4;
	model_transform = mult( model_transform, rotation(radius*Math.sin(parent.graphicsState.animation_time/2000),0,0,1));
	model_transform = mult( model_transform, translation(0,flower_radius+del_h,0));
	model_transform = mult( model_transform, scale(flower_radius,flower_radius,flower_radius));
	parent.m_sphere.draw( parent.graphicsState, model_transform, red );	

	// trunks
	for (var i = 0 ; i != nTrunks; i++) {
		model_transform = stack.pop();
		model_transform = mult( model_transform, translation(0,del_h/2,0));
		model_transform = mult( model_transform, scale(1,del_h,1));
		parent.m_cube.draw( parent.graphicsState, model_transform, green );			
	}
}

function draw_bee(parent, model_transform){
		var stack = [];
		var greyPlastic = new Material( vec4( .5,.5,.5,1 ), .5, .8, .5, 20 ),
			black = new Material( vec4( 0.2,0.2,0.2,1 ), .8, .3, .1, 20 ),
			bluePlastic = new Material( vec4( .0,.0,.9,.6 ), .2, .4, .3, 30),
			yellow = new Material( vec4(1,1,0,1),.8,.1,.1,10);
			// earth = new Material( vec4( .7,.9,.5,1 ), .5, 0.1, .5, 10),
			// stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40 ),
			// smilyface = new Material( vec4(1,1,0,1),.8,.1,.1,10); 
			
		// bee fat second half body
		var bee_init_height = 15;	
		var bee_body_len = 5;
		model_transform = mat4();
		model_transform = mult( model_transform, translation(0,bee_init_height,0));
		model_transform = mult( model_transform, translation( 0, Math.sin(parent.graphicsState.animation_time/100), 0) );
		model_transform = mult( model_transform, rotation( parent.graphicsState.animation_time/30, 0, 1, 0 ) );
		model_transform = mult( model_transform, translation(20,0,0));
		model_transform = mult( model_transform, rotation( 90, 0, 1, 0 ) );
		stack.push(model_transform);
		model_transform = mult( model_transform, scale(bee_body_len,2.5,2.5));
		parent.m_cube.draw( parent.graphicsState, model_transform, greyPlastic);			

		// bee first half body
		model_transform = stack.pop();
		stack.push(model_transform);

		model_transform = mult( model_transform, translation(-bee_body_len/2-2.5,0,0));
		model_transform = mult( model_transform, scale(2.5,1.5,1.5));
		parent.m_sphere.draw( parent.graphicsState, model_transform, yellow );			

		// draw legs
		model_transform = stack.pop();
		stack.push(model_transform);
		model_transform = mult( model_transform, translation(-2,0,0));
		for(var k = 0; k != 3; k++ ){
			draw_leg(parent,model_transform , k, greyPlastic, 1);
			draw_leg(parent,model_transform , k, greyPlastic, -1);
		}

		// draw wings
		for( var RorL = -1; RorL <= 1; RorL +=2){
			model_transform = stack.pop();
			stack.push(model_transform);
			model_transform = mult( model_transform, translation(0, 2.5/2, RorL*2.5/2));
			model_transform = mult( model_transform, rotation((RorL*20*Math.cos(parent.graphicsState.animation_time/100)), 1, 0, 0) );
			model_transform = mult( model_transform, translation(0,0,RorL*2.5));
			model_transform = mult( model_transform, scale(2,0.1,5));
			parent.m_cube.draw( parent.graphicsState, model_transform, bluePlastic);		
		}

		// head
		model_transform = stack.pop();
		model_transform = mult( model_transform, translation(bee_body_len/2+2, 0, 0));
		stack.push(model_transform);
		model_transform = mult( model_transform, scale(2,2,2));
		parent.m_sphere.draw( parent.graphicsState, model_transform, black);

		// antenna
		for( var RorL = -1; RorL <= 1; RorL +=2){
			model_transform = stack.pop();
			stack.push(model_transform);
			model_transform = mult( model_transform, rotation(RorL*30, 1,0,0));
			model_transform = mult( model_transform, translation(0, 2.5, 0));
			model_transform = mult( model_transform, scale(.4,1,.4));
			parent.m_cube.draw( parent.graphicsState, model_transform, black);
		}
	
}
// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();
		
		// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		var	plane = new Material( vec4(.7,.5,0.5,1),.5,.1,.1,10 );
		
		/**********************************
		Start coding here!!!!
		**********************************/
		
		var bottom_level = 0;
		var stack = [];

		// static ground plane
		model_transform = mult( model_transform, scale(1000, 1, 1000));
		this.m_cube.draw( this.graphicsState, model_transform, plane );

		draw_flower(this, model_transform);
		draw_bee(this, model_transform);
		/*
		// Another way to construct flower.(insteand of using 8 parts)
		// flower stem
		var height = bottom_level+0.5;
		var radius = 1;
		var nTrunks = 50;
		var a = 0.5, c = 0.05, del_h = 0.5;

		
		for (var i = 0 ; i != nTrunks; i++) {
			radius = a* Math.exp(c*i);
			model_transform = mult( mat4(), translation(radius*Math.sin(this.graphicsState.animation_time/2000),height,0));
			model_transform = mult( model_transform, scale(1,.5,1));
			this.m_cube.draw( this.graphicsState, model_transform, green );			
			height += del_h;
		}
		
		// flower
		// x = 0.5e^(0.05i)
		// x' = 0.025e^(0.05i) 
		var slope = a*c* Math.exp(c*(nTrunks-1));
		// y = ax + c
		var theta = Math.atan(slope)*180/Math.PI;
		model_transform = mult( mat4(), rotation( -theta*Math.sin(this.graphicsState.animation_time/2000), 0, 0, 1) );
		model_transform = mult( model_transform, translation(0,height-del_h/2+5,0));
		model_transform = mult( model_transform, scale(5,5,5));
		this.m_sphere.draw( this.graphicsState, model_transform, red );			
		*/

	}	

Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}