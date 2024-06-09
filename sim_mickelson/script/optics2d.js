function inheritPrototype(p) {
    if (p==null) throw TypeError();
    if (Object.create) return Object.create(p);
    var t = typeof p;
    if (t!=="object" && t !== "function") throw TypeError();
    function f() {};
    f.prototype = p;
    return new f();       
}


Optic2d = {}


Optic2d.Ray = function(P,U,stroke) {
    View2d.Object2d.call(this);
    this.P = P;
    var norm = Math.sqrt(U[0]*U[0]+U[1]*U[1]);
    this.U = [U[0]/norm,U[1]/norm];
    this.t = 0.0;
    this.longueur = 0.0;
    this.actif = true;
    this.virtuel = false;
    this.indice = 1.0;
    this.strokeStyle = stroke;
}
Optic2d.Ray.prototype = inheritPrototype(View2d.Object2d.prototype);
Optic2d.Ray.prototype.constructor = Optic2d.Ray;
Optic2d.Ray.prototype.setDirection = function(U) {
    var norm = Math.sqrt(U[0]*U[0]+U[1]*U[1]);
    this.U = [U[0]/norm,U[1]/norm];  
}
Optic2d.Ray.prototype.setPoint = function(P) {
    this.P = [P[0],P[1]];   
}
Optic2d.Ray.prototype.drawing = function(context2d) {
    context2d.context.beginPath();
    context2d.moveTo(this.P);
    context2d.lineTo([this.P[0]+this.t*this.U[0],this.P[1]+this.t*this.U[1]]);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.stroke();   
}
Optic2d.Ray.prototype.getPoint = function(t) {
    return [this.P[0]+this.U[0]*t,this.P[1]+this.U[1]*t];     
}


Optic2d.Miror = function(r,name,font,stroke) {
    View2d.Object2d.call(this);
    this.r = r;
    this.font = font;
    this.strokeStyle = stroke;
    this.name = name;
    this.lineWidth = 2;
}
Optic2d.Miror.prototype = inheritPrototype(View2d.Object2d.prototype);
Optic2d.Miror.prototype.constructor = Optic2d.Miror;
Optic2d.Miror.prototype.drawing = function(context2d) {
    context2d.context.beginPath();
    context2d.moveTo([-this.r,0]);
    context2d.lineTo([this.r,0]);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.context.stroke();
    context2d.context.font = this.font;
    context2d.context.textAlign = "left";
    context2d.context.textBaseline = "middle";
    context2d.context.fillStyle = this.strokeStyle;
    context2d.fillText(this.name,[this.r,0]);
}
Optic2d.Miror.prototype.image = function(P) {
    var Pobject = this.matrix.applyInverse(P);
    var Iobject = [Pobject[0],-Pobject[1]];
    return this.matrix.apply(Iobject);
}
Optic2d.Miror.prototype.reflect = function(ray,reflectRay) {
    var Pobject = this.matrix.applyInverse(ray.P);
    var Uobject = this.matrix.vectorInverse(ray.U);
    if (Uobject[1]==0) {
        ray.actif = false;
        return false;
    }
    var t = -Pobject[1]/Uobject[1];
    var I = ray.getPoint(t);
    ray.t = t;
    ray.longueur = t*ray.indice;
    Uobject = [Uobject[0],-Uobject[1]];
    var U = this.matrix.vector(Uobject);
    if (reflectRay) {
        reflectRay.P = I;
        reflectRay.U = U;
    }
    else {
        return new Optic2d.Ray(I,U,ray.stroke);   
    }
    
}

/* lentille mince (approximation paraxiale)
   si f>0 le foyer image est du cÃ´tÃ© y>0
*/
Optic2d.Lens = function(r,name,fname,font,stroke,arrowsize,f) {
    View2d.Object2d.call(this);
    this.r = r;
    this.font = font;
    this.strokeStyle = stroke;
    this.name = name;
    this.lineWidth = 2;
    this.focus = new Optic2d.Point(2,fname,font,stroke);
    this.focus.matrix.translate(0,f);
    this.add(this.focus);
    this.f = f;
    this.arrowsize = arrowsize;
}
Optic2d.Lens.prototype = inheritPrototype(View2d.Object2d.prototype);
Optic2d.Lens.prototype.constructor = Optic2d.Lens;
Optic2d.Lens.prototype.drawing = function(context2d) {
    var s = 1;
    if (this.f<0) s = -1;
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.context.beginPath();
    context2d.moveTo([-this.r+s*this.arrowsize,this.arrowsize]);
    context2d.lineTo([-this.r,0]);
    context2d.lineTo([-this.r+s*this.arrowsize,-this.arrowsize]);
    context2d.context.stroke();
    context2d.context.beginPath();
    context2d.moveTo([this.r-s*this.arrowsize,this.arrowsize]);
    context2d.lineTo([this.r,0]);
    context2d.lineTo([this.r-s*this.arrowsize,-this.arrowsize]);
    context2d.context.stroke();
    context2d.context.beginPath();
    context2d.moveTo([-this.r,0]);
    context2d.lineTo([this.r,0]);
    context2d.context.stroke();
    context2d.context.font = this.font;
    context2d.context.textAlign = "left";
    context2d.context.textBaseline = "middle";
    context2d.context.fillStyle = this.strokeStyle;
    context2d.fillText(this.name,[this.r,0]);
}
Optic2d.Lens.prototype.image = function(P) {
    var Pobject = this.matrix.applyInverse(P);
    var yo = Pobject[1];
    var yi;
    if (yo==0) yi=0.0;
    else yi=1/(1/yo+1/this.f);
    Iobject = [yi/yo*Pobject[0],yi];
    return this.matrix.apply(Iobject);   
}
Optic2d.Lens.prototype.refract = function(ray,refractRay,sens) {
    var Pobject = this.matrix.applyInverse(ray.P);
    var Uobject = this.matrix.vectorInverse(ray.U);
    if (Uobject[1]==0) {
        ray.actif = false;
        return false;
    }
    var t = -Pobject[1]/Uobject[1];
    var I = ray.getPoint(t);
    ray.t = t;
    ray.longueur = t*ray.indice;
    var Iobject = [Pobject[0]+t*Uobject[0],Pobject[1]+t*Uobject[1]];
    t = sens*this.f/Uobject[1];
    Uobject = [t*Uobject[0]-Iobject[0],t*Uobject[1]-Iobject[1]];
    var norm=Math.sqrt(Uobject[0]*Uobject[0]+Uobject[1]*Uobject[1]);
    var U = this.matrix.vector([Uobject[0]/norm,Uobject[1]/norm]);
    if (refractRay) {
        refractRay.P = I;
        refractRay.U = U;
    }
    else {
        return new Optic2d.Ray(I,U,ray.stroke);   
    }  
}

Optic2d.Point = function(size,name,font,stroke) {
    View2d.Object2d.call(this);
    this.size = size;
    this.strokeStyle = stroke;
    this.fillStyle = stroke;
    this.font = font;
    this.name = name;
}
Optic2d.Point.prototype = inheritPrototype(View2d.Object2d.prototype);
Optic2d.Point.prototype.constructor = Optic2d.Point;
Optic2d.Point.prototype.drawing = function(context2d) {
    context2d.context.beginPath();
    var xy = context2d.modelview.apply([0,0]);
    context2d.context.arc(xy[0],xy[1],this.size,0,Math.PI*2,false);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.fillStyle = this.fillStyle;
    context2d.context.stroke();
    context2d.context.fill();
    context2d.context.font = this.font;
    context2d.context.textAlign = "center";
    context2d.context.textBaseline = "top";
    context2d.context.fillText(this.name,xy[0],xy[1]+this.size);
}

