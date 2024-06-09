function inheritPrototype(p) {
    if (p==null) throw TypeError();
    if (Object.create) return Object.create(p);
    var t = typeof p;
    if (t!=="object" && t !== "function") throw TypeError();
    function f() {};
    f.prototype = p;
    return new f();       
}

Interferences = {}


Interferences.ShaderProgram = function(gl,vertexShader,fragmentShader) {
    this.gl = gl;
    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
    this.program = 0;
    this.createProgram();
}
Interferences.ShaderProgram.prototype = {
    getShader:function(type,source) {
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader,source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
        }
        return shader;
    },
    createProgram:function() {
        if (this.program) {
            return this.program;   
        }
        
        var vertexShader = this.getShader(this.gl.VERTEX_SHADER,this.vertexShader);
        var fragmentShader = this.getShader(this.gl.FRAGMENT_SHADER,this.fragmentShader);
        var shaderProgram = this.gl.createProgram();  
        this.gl.attachShader(shaderProgram, vertexShader);  
        this.gl.attachShader(shaderProgram, fragmentShader);  
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error("Unable to initialize the shader program.");
        }
        this.program = shaderProgram;
        if (this.init) this.init();
        return this.program; 
    },
    draw:function() {}
}



/* deux sources ponctuelles */

Interferences.DeuxSourcesShaderProgram = function(gl) {
    var vertexShader = [
        "attribute vec2 aVertexPosition;",
        "void main(void){",
        "   gl_Position = vec4(aVertexPosition,0.0,1.0);",
        "}",
    ].join("\n")
    var fragmentShader = [
        "precision mediump float;",
        "uniform vec4 uColor;",
        "uniform vec3 uS1;",
        "uniform vec3 uS2;",
        "uniform vec2 uCenter;",
        "uniform float uK;",
        "uniform vec2 uSize;",
        "uniform int uInfini;",
        "uniform float uFocale;",
        "void main(void) {",
        "   vec3 M = vec3(gl_FragCoord.xy-uCenter,0.0);",
        "   M.x /= uSize.x;",
        "   M.y /= uSize.y;",
        "   float delta;",
        "   if (uInfini==1) delta = dot(uS2-uS1,normalize(vec3(M.xy,uFocale)));",  
        "   else delta = distance(M,uS1)-distance(M,uS2);",
        "   gl_FragColor.rgb = uColor.rgb*0.5*(1.0+cos(uK*delta));",
        "   gl_FragColor.a = uColor.a;",
        "}",
    ].join("\n")
    this.vertices = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    Interferences.ShaderProgram.call(this,gl,vertexShader,fragmentShader);
}
Interferences.DeuxSourcesShaderProgram.prototype = inheritPrototype(Interferences.ShaderProgram.prototype)
Interferences.DeuxSourcesShaderProgram.prototype.constructor = Interferences.DeuxSourcesShaderProgram
Interferences.DeuxSourcesShaderProgram.prototype.init = function() {
       this.aVertexPositionLocation = this.gl.getAttribLocation(this.program,"aVertexPosition");
          this.uColorLocation = this.gl.getUniformLocation(this.program,"uColor");
          this.uKLocation = this.gl.getUniformLocation(this.program,"uK");
          this.uS1Location = this.gl.getUniformLocation(this.program,"uS1");
          this.uS2Location = this.gl.getUniformLocation(this.program,"uS2");
          this.uCenterLocation = this.gl.getUniformLocation(this.program,"uCenter");
          this.uSizeLocation = this.gl.getUniformLocation(this.program,"uSize");
          this.uInfiniLocation = this.gl.getUniformLocation(this.program,"uInfini");
          this.uFocaleLocation = this.gl.getUniformLocation(this.program,"uFocale");
          this.aVertexPositionBuffer = this.gl.createBuffer();
}
Interferences.DeuxSourcesShaderProgram.prototype.setArg = function(color,S1,S2,K,center,size,infini,focale) {
        this.color = new Float32Array(color);
        this.S1 = new Float32Array(S1);
        this.S2 = new Float32Array(S2);
        this.K = K;
         this.size = new Float32Array(size);
         this.center = new Float32Array(center);
        if (infini) this.infini = 1;
        else this.infini = 0;
        this.focale = focale;
       
}
Interferences.DeuxSourcesShaderProgram.prototype.draw = function() {
    this.gl.useProgram(this.program);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enableVertexAttribArray(this.aVertexPositionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aVertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.aVertexPositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.uniform3fv(this.uS1Location,this.S1)
        this.gl.uniform3fv(this.uS2Location,this.S2)
        this.gl.uniform1f(this.uKLocation,this.K)
        this.gl.uniform4fv(this.uColorLocation,this.color);
        this.gl.uniform2fv(this.uCenterLocation,this.center);
        this.gl.uniform2fv(this.uSizeLocation,this.size);
        this.gl.uniform1i(this.uInfiniLocation,this.infini);
        this.gl.uniform1f(this.uFocaleLocation,this.focale);
        this.gl.drawArrays(this.gl.TRIANGLES,0,6); 
        this.gl.flush();
        
} 

/* liste de paires de sources (Ã©clairement Ã  additionner)*/
/* chaque paire est rÃ©pliquÃ©e dans la direction Y */
Interferences.ListeDeuxSourcesShaderProgram = function(gl,ne) {
    var vertexShader = [
        "attribute vec2 aVertexPosition;",
        "void main(void){",
        "   gl_Position = vec4(aVertexPosition,0.0,1.0);",
        "}",
    ].join("\n")
    this.n = ne*2+1;
    var f = 0.5/(this.n);
    var fragmentShader = [
        "precision mediump float;",
        "uniform vec4 uColor;",
        "uniform vec3 uS1;",
        "uniform vec3 uS2;",
        "uniform vec2 uCenter;",
        "uniform float uK;",
        "uniform vec2 uSize;",
        "uniform float uDY;",
        "uniform int uInfini;",
        "uniform float uFocale;",
        "void main(void) {",
        "   vec3 M = vec3(gl_FragCoord.xy-uCenter,0.0);",
        "   M.x /= uSize.x;",
        "   M.y /= uSize.y;",
         "  vec3 color = vec3(0.0,0.0,0.0);",
        "   float delta;",
        "   vec3 d;",
        "   for (int j=-"+ne+"; j<="+ne+"; j++) {",
        "       d = vec3(0.0,float(j)*uDY,0.0);",
        "       if (uInfini==1) delta = dot(uS2-uS1,normalize(vec3(M.xy,uFocale)));", 
        "       else delta = distance(M,uS1+d)-distance(M,uS2+d);",
        "           color += "+f+"*uColor.rgb*(1.0+cos(uK*delta));",
        "   }",
        "   gl_FragColor.rgb = color;",
        "   gl_FragColor.a = uColor.a;",
        "}",
    ].join("\n")
    this.vertices = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    Interferences.ShaderProgram.call(this,gl,vertexShader,fragmentShader);
}
Interferences.ListeDeuxSourcesShaderProgram.prototype = inheritPrototype(Interferences.ShaderProgram.prototype)
Interferences.ListeDeuxSourcesShaderProgram.prototype.constructor = Interferences.ListeDeuxSourcesShaderProgram
Interferences.ListeDeuxSourcesShaderProgram.prototype.init = function() {
       this.aVertexPositionLocation = this.gl.getAttribLocation(this.program,"aVertexPosition");
          this.uColorLocation = this.gl.getUniformLocation(this.program,"uColor");
          this.uKLocation = this.gl.getUniformLocation(this.program,"uK");
          this.uS1Location = this.gl.getUniformLocation(this.program,"uS1");
          this.uS2Location = this.gl.getUniformLocation(this.program,"uS2");
          this.uCenterLocation = this.gl.getUniformLocation(this.program,"uCenter");
          this.uSizeLocation = this.gl.getUniformLocation(this.program,"uSize");
          this.uDYLocation = this.gl.getUniformLocation(this.program,"uDY");
          this.uInfiniLocation = this.gl.getUniformLocation(this.program,"uInfini");
          this.uFocaleLocation = this.gl.getUniformLocation(this.program,"uFocale");
          this.aVertexPositionBuffer = this.gl.createBuffer();
}
Interferences.ListeDeuxSourcesShaderProgram.prototype.setArg = function(color,liste,K,center,size,extent,infini,focale) {
        this.liste = liste;
        this.n = liste.length;
        this.color = new Float32Array([color[0]/this.n,color[1]/this.n,color[2]/this.n,1.0]);
        this.K = K;
         this.size = new Float32Array(size);
         this.center = new Float32Array(center);
        this.dy = extent/(this.n-1)
        if (infini) this.infini = 1;
        else this.infini = 0;
        this.focale = focale;
}
Interferences.ListeDeuxSourcesShaderProgram.prototype.draw = function() {
    this.gl.useProgram(this.program);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enableVertexAttribArray(this.aVertexPositionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aVertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.aVertexPositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.uniform1f(this.uKLocation,this.K)
        this.gl.uniform1f(this.uDYLocation,this.dy)
        this.gl.uniform4fv(this.uColorLocation,this.color);
        this.gl.uniform2fv(this.uCenterLocation,this.center);
        this.gl.uniform2fv(this.uSizeLocation,this.size);
        this.gl.uniform1i(this.uInfiniLocation,this.infini);
        this.gl.uniform1f(this.uFocaleLocation,this.focale);
        for (var k=0; k<this.n; k++) {
            this.gl.uniform3fv(this.uS1Location,new Float32Array(this.liste[k][0]));
            this.gl.uniform3fv(this.uS2Location,new Float32Array(this.liste[k][1]));
            this.gl.drawArrays(this.gl.TRIANGLES,0,6);
               
        }
        this.gl.flush();
        
} 

/* deux sources Ã©tendues */
Interferences.DeuxSourcesEtenduesShaderProgram = function(gl,ne) {
     var vertexShader = [
        "attribute vec2 aVertexPosition;",
        "void main(void){",
        "   gl_Position = vec4(aVertexPosition,0.0,1.0);",
        "}",
    ].join("\n")
    this.n = ne*2+1;
    var f = 0.5/(this.n*this.n);
    var fragmentShader = [
        "precision mediump float;",
        "uniform vec4 uColor;",
        "uniform vec3 uS1;",
        "uniform vec3 uS2;",
        "uniform vec2 uCenter;",
        "uniform float uK;",
        "uniform vec2 uSize;",
        "uniform float uDX;",
        "void main(void) {",
        "   vec3 M = vec3(gl_FragCoord.xy-uCenter,0.0);",
        "   M.x /= uSize.x;",
        "   M.y /= uSize.y;",
        "   vec3 color = vec3(0.0,0.0,0.0);",
        "   float delta;",
        "   vec3 d;",
        "   for (int i=-"+ne+"; i<="+ne+"; i++) {",
        "       for (int j=-"+ne+"; j<="+ne+"; j++) {",
        "           d = vec3(float(i)*uDX,float(j)*uDX,0.0);",
        "           delta = distance(M,uS1+d)-distance(M,uS2+d);",
        "           color += "+f+"*uColor.rgb*(1.0+cos(uK*delta));",
        "        }",
        "   }",
        "   gl_FragColor.rgb = color;",
        "   gl_FragColor.a = uColor.a;",
        "}",
    ].join("\n")
    //console.log(fragmentShader)
    this.vertices = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    Interferences.ShaderProgram.call(this,gl,vertexShader,fragmentShader);  
}
Interferences.DeuxSourcesEtenduesShaderProgram.prototype = inheritPrototype(Interferences.ShaderProgram.prototype)
Interferences.DeuxSourcesEtenduesShaderProgram.prototype.constructor = Interferences.DeuxSourcesEtenduesShaderProgram
Interferences.DeuxSourcesEtenduesShaderProgram.prototype.init = function() {
       this.aVertexPositionLocation = this.gl.getAttribLocation(this.program,"aVertexPosition");
          this.uColorLocation = this.gl.getUniformLocation(this.program,"uColor");
          this.uKLocation = this.gl.getUniformLocation(this.program,"uK");
          this.uS1Location = this.gl.getUniformLocation(this.program,"uS1");
          this.uS2Location = this.gl.getUniformLocation(this.program,"uS2");
          this.uCenterLocation = this.gl.getUniformLocation(this.program,"uCenter");
          this.uSizeLocation = this.gl.getUniformLocation(this.program,"uSize");
          this.aVertexPositionBuffer = this.gl.createBuffer();
          this.uDXLocation = this.gl.getUniformLocation(this.program,"uDX");
}
Interferences.DeuxSourcesEtenduesShaderProgram.prototype.setArg = function(color,S1,S2,K,center,size,extent) {
        this.color = new Float32Array(color);
        this.S1 = new Float32Array(S1);
        this.S2 = new Float32Array(S2);
        this.K = K;
         this.size = new Float32Array(size);
         this.center = new Float32Array(center);
         this.dx = extent/(this.n-1);
        
       
}
Interferences.DeuxSourcesEtenduesShaderProgram.prototype.draw = function() {
    this.gl.useProgram(this.program);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enableVertexAttribArray(this.aVertexPositionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aVertexPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(this.aVertexPositionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.uniform3fv(this.uS1Location,this.S1)
        this.gl.uniform3fv(this.uS2Location,this.S2)
        this.gl.uniform1f(this.uKLocation,this.K)
        this.gl.uniform4fv(this.uColorLocation,this.color);
        this.gl.uniform2fv(this.uCenterLocation,this.center);
        this.gl.uniform2fv(this.uSizeLocation,this.size);
        this.gl.uniform1f(this.uDXLocation,this.dx)
        this.gl.drawArrays(this.gl.TRIANGLES,0,6); 
        this.gl.flush();
        
} 

/* sortie sur canvas */
Interferences.CanvasRenderer = function(canvas) {
    this.gl = canvas.getContext("experimental-webgl");
    if (!this.gl) {
        this.gl = canvas.getContext("webgl");
        if (!this.gl) throw new Error("Drawing3D : WebGL not supported by your browser");     
    }
    this.canvas = canvas;
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFuncSeparate(this.gl.ONE,this.gl.ONE,this.gl.ONE,this.gl.ONE);
    this.gl.clearColor(0,0,0, 1.0); 
    this.width = canvas.width;
    this.height = canvas.height;
    this.gl.viewport(0,0,canvas.width,canvas.height);
}
