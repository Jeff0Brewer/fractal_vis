function init_recur(root, angle, angle_steps, len, points, levels_left){
	let len_mult = .99;

	let new_angle = angle + angle_steps[levels_left - 1];
	let new_branch = add(root, mult([Math.sin(new_angle), Math.cos(new_angle)], len));
	points.push(root);
	points.push(new_branch);
	if(levels_left > 0)
		init_recur(new_branch, new_angle, angle_steps, len * len_mult, points, levels_left - 1);

	new_angle = angle - angle_steps[levels_left - 1];
	new_branch = add(root, mult([Math.sin(new_angle), Math.cos(new_angle)], len));
	points.push(root);
	points.push(new_branch);
	if(levels_left > 0)
		init_recur(new_branch, new_angle, angle_steps, len * len_mult, points, levels_left - 1);
}


class Vis{
	constructor(p_fpv, num_copies, num_levels){
		this.p_fpv = p_fpv;
		this.num_levels = num_levels;
		this.num_copies = num_copies;
		this.size = .9;
		this.copy_rotation = Math.PI*2/num_copies*(180/Math.PI);

		this.color_map = new ColorMap('#000000 0%, #ff0000 25%, #0000ff 50%, #00ff00 75%, #ffffff 100%');

		this.points = [];

		this.points = [];
		let angles = [];
		for(let i = 0; i < num_levels; i++){
			angles.push(0);
		}
		init_recur([0,0], 0, angles, this.size, this.points, num_levels);

		this.pos_buffer = new Float32Array(this.p_fpv*this.points.length);

		let pos_ind = 0;
		for(let i = 0; i < this.points.length; i++){
			for(let j = 0; j < this.points[i].length; j++, pos_ind++){
				this.pos_buffer[pos_ind] = this.points[i][j];
			}
		}

		this.u_Color = gl.getUniformLocation(gl.program, "u_Color");
		this.u_Time = gl.getUniformLocation(gl.program, "u_Time");

		gl.lineWidth(5.0);
	}


	init_buffers(){
		this.fsize = this.pos_buffer.BYTES_PER_ELEMENT;

		//position buffer
		this.gl_pos_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_pos_buf);
		gl.bufferData(gl.ARRAY_BUFFER, this.pos_buffer, gl.DYNAMIC_DRAW);

		this.a_Position = gl.getAttribLocation(gl.program, "a_Position");
		gl.vertexAttribPointer(this.a_Position, this.p_fpv, gl.FLOAT, false, this.fsize * this.p_fpv, 0);
		gl.enableVertexAttribArray(this.a_Position);

	}

	draw(u_ModelMatrix){
		//position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_pos_buf);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.pos_buffer);
		gl.vertexAttribPointer(this.a_Position, this.p_fpv, gl.FLOAT, false, this.fsize * this.p_fpv, 0);

		//drawing

		pushMatrix(modelMatrix);
		for(let i = 0; i < this.num_copies; i++){
			gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
			gl.drawArrays(gl.LINES, 0, this.pos_buffer.length / this.p_fpv);
			modelMatrix.rotate(this.copy_rotation, 0, 0, 1);
		}
		modelMatrix = popMatrix();
	}

	update(fData){
		let color = this.color_map.map(average(fData), 0, 130);
		gl.uniform4fv(this.u_Color, [color.r, color.g, color.b, 1.0]);

		gl.uniform1f(this.u_Time, ((new Date().getTime() / 1000) % 60)*100000 % 100000);

		let angles = [];
		for(let i = 0; i < this.num_levels; i++){
			let ind = (this.num_levels - i);
			let start_ind = Math.floor(ind*fData.length/this.num_levels*.7);
			let end_ind = Math.floor((ind + 1)*fData.length/this.num_levels*.7);
			angles.push(map(average(fData.slice(start_ind, end_ind)), 0, 255, 0, Math.PI*.275));
		}

		this.points = [];
		init_recur([0,0], 0, angles, this.size, this.points, this.num_levels);

		let pos_ind = 0;
		for(let i = 0; i < this.points.length; i++){
			for(let j = 0; j < this.points[i].length; j++, pos_ind++){
				this.pos_buffer[pos_ind] = this.points[i][j];
			}
		}
	}
}
