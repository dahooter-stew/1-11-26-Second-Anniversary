const canvas = document.getElementById('myCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  alert("WebGL not supported");
}

let program;
let position;
let heartsLoc;

let RUN = false;
let WIDTH;
let HEIGHT;

let timer;

const hearts = [];
const hearts_amt = 15;

function resize()
{
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  hearts_to_center();
}

window.addEventListener('resize', resize)

function compile(type, source)
{
	const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

function hearts_to_center()
{
	for (let i = 0; i < hearts.length; i++)
	{
		hearts[i].x = WIDTH / 2;
		hearts[i].y = HEIGHT / 2;
	}
}

function init_hearts(hearts, amount)
{
	for (let i = 0; i < amount; i++)
	{
		let dir = Math.random() * Math.PI * 2.0;
		let speed = Math.random() * 50.0 + 50;
		hearts.push(
			{
				x: Math.random() * (WIDTH - 300) + 150,
				y: Math.random() * (HEIGHT - 300) + 150,
				dx: speed * Math.cos(dir),
				dy: speed * Math.sin(dir),
				angle: Math.random() * Math.PI * 2.0,
				size: Math.random() * 85.0 + 15,
			}
		)
	}
}

function notify()
{
  fetch('https://ntfy.sh/NqNPMlT5IwJZLeYF', {
    method: 'POST',
    body: 'maria poke >.<',
  })
}

function init()
{
	RUN = true;
	resize();
  document.addEventListener("pointerdown", notify);


	init_hearts(hearts, hearts_amt);

	timer = {
		current_time: performance.now(),
		previous_time: performance.now(),
		reset: function() {
			this.current_time = performance.now();
			let difference = this.current_time - this.previous_time;
			this.previous_time = this.current_time;

			return difference * 0.001;
		}
	}

	const vertex_source = `
		attribute vec2 position;
		void main() {
			gl_Position = vec4(position, 0.0, 1.0);
		}
	`;

	const fragment_source = `
    precision highp float;

    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec4 hearts[${hearts_amt}];

    float dot2( in vec2 v ) { return dot(v,v); }

    vec2 rotateVec2(vec2 p, float a)
    {
      float rx = cos(a); 
      float ry = sin(a);

      return mat2(
        rx, ry,
        -ry, rx
      ) * p;
    }

    float sdHeart(vec2 p)
    {
        p.x = abs(p.x);

        if( p.y+p.x>1.0 ) return sqrt(dot2(p-vec2(0.25,0.75))) - sqrt(2.0)/4.0;
            
        return sqrt(min(dot2(p-vec2(0.00,1.00)), dot2(p-0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution;
      vec4 color = vec4(1.0, 0.7725, 0.8274, 1.0);
      
      float k = 0.040;
      float total = 0.0;

      for (int i = 0; i < ${hearts_amt}; i++)
      {
        float d = sdHeart((rotateVec2(gl_FragCoord.xy - hearts[i].xy, hearts[i].w)) / hearts[i].z) * hearts[i].z;

        total += exp(-d * k);

      }

      float val = -log(total) / k;
      if (val <= 0.0)
        color = vec4(1.0);
      float bloom = exp(-abs(val)*0.1); // tweak 20.0 for intensity
      color += vec4(vec3(bloom), 1.0); // additive
      gl_FragColor = color;
    }
	`;

	program = gl.createProgram();
	gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex_source));
	gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment_source));
	gl.linkProgram(program);
	gl.useProgram(program);

	iResolution = gl.getUniformLocation(program, "iResolution");
	iTime = gl.getUniformLocation(program, "iTime");
	heartsLoc = gl.getUniformLocation(program, "hearts[0]");

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

	gl.bufferData(
	  gl.ARRAY_BUFFER,
	  new Float32Array([
	    -1, -1,
	    -1, 1,
	    1,  1,
      -1, -1,
      1, 1,
      1, -1,
	  ]),
	  gl.STATIC_DRAW
	);

	position = gl.getAttribLocation(program, "position");
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	tick()
}

function update(dt)
{

  for (let i = 0; i < hearts.length; i++) {
    const heart = hearts[i];

    heart.x += heart.dx * dt;
    heart.y += heart.dy * dt;
    heart.angle += dt;

    const left = heart.x - heart.size;
    const right = heart.x + heart.size;
    const top = heart.y - heart.size;
    const bottom = heart.y + heart.size;

    if (left < 0) 
    {
      heart.x = heart.size; 
      heart.dx *= -1;
    } 
    else if (right > WIDTH) 
    {
      heart.x = WIDTH - heart.size;
      heart.dx *= -1;
    }
    if (top < 0) 
    {
      heart.y = heart.size;
      heart.dy *= -1;
    } 
    else if (bottom > HEIGHT) 
    {
      heart.y = HEIGHT - heart.size;
      heart.dy *= -1;
    }
  }

  // for (let i = 0; i < hearts.length; i++)
  // {
  //   const heart = hearts[i];

  //   for (let j = 0; j < hearts.length; j++)
  //   {
  //     if (i == j)
  //     {
  //       continue;
  //     }

  //     const other_heart = hearts[j];

  //     const dx = other_heart.x - heart.x;
  //     const dy = other_heart.y - heart.y;
  //     const d = (dx * dx + dy * dy);

  //     if (d < 15.0)
  //     {
  //       continue;
  //     }

  //     const f = 10.0 * (heart.size * other_heart.size) / d;
  //     const d2 = Math.sqrt(d);
  //     const fx = dx / d2 * f;
  //     const fy = dy / d2 * f;

  //     heart.dx += fx * dt;
  //     heart.dy += fy * dt;
  //   }
  // }
}

function render(dt)
{
  	const heartData = new Float32Array(hearts_amt * 4);
  	for (let i = 0; i < hearts_amt; i++) {
  	  heartData[i * 4 + 0] = hearts[i].x;
  	  heartData[i * 4 + 1] = hearts[i].y;
  	  heartData[i * 4 + 2] = hearts[i].size;
  	  heartData[i * 4 + 3] = hearts[i].angle;
  	}

  	gl.uniform4fv(heartsLoc, heartData);
  	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function tick()
{
	dt = timer.reset();

	update(dt);
	render(dt);

	requestAnimationFrame(tick);
}


init()
