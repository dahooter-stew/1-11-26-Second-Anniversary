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
  vec4 color = vec4(0.0);
  
  for (int i = 0; i < ${hearts_amt}; i++)
  {
    float d = sdHeart((rotateVec2(gl_FragCoord.xy - hearts[i].xy, hearts[i].w)) / hearts[i].z) * hearts[i].z;
    if (d < 0.0)
    {
      // hard heart
    if (d < 0.0)
        color = vec4(1.0);

    // glow
    float bloom = exp(-d*d*20.0); // tweak 20.0 for intensity
    color += vec4(vec3(bloom), 0.0); // additive
    }
  }

  gl_FragColor = color;
}

