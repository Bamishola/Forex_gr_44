
function Drawing3D(canvas,fill,mobile,autorendering,preserveDrawing) {
    this.gl = canvas.getContext("experimental-webgl",{preserveDrawingBuffer: preserveDrawing});
    if (!this.gl) {
        this.gl = canvas.getContext("webgl");
        if (!this.gl) throw new Error("Drawing3D : WebGL not supported by your browser");     
    }
    
    //var extensions = this.gl.getSupportedExtensions();
    //for (var k=0; k<extensions.length; k++) console.log(extensions[k]);
    this.canvas = canvas;
    this.gl.viewport(0,0,canvas.width,canvas.height);
    this.gl.clearColor(fill[0], fill[1], fill[2], 1.0); 
    this.gl.enable(this.gl.DEPTH_TEST);
    //this.gl.enable(this.gl.CULL_FACE);
    this.gl.frontFace(this.gl.CCW);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA,this.gl.ONE,this.gl.ONE);
    this.width = canvas.width;
    this.height = canvas.height;
    this.w2 = this.width/2;
    this.h2 = this.height/2;
    this.context = new Objet3D.Context();
    this.top = 1;
    this.depth = 2;
    this.fov = 40;
    
    //this.context.P.orthographic(-1,1,-1,1,-1,1);
    
    this.context.camera(this.fov,this.top,this.width/this.height,this.depth);
    
    this.base = new ShaderProgramsBase(this.gl);
    this.scene = new Objet3D(this.gl,this.base);
    if (mobile) {
        $(canvas).bind('vmousedown',{that:this},this.mousedown);
        $(canvas).bind('vmouseup',{that:this},this.mouseup);
        $(canvas).bind('vmousemove',{that:this},this.mousemove);
        $(canvas).bind('vmouseout',{that:this},this.mouseup);
        $(canvas).bind('vclick',{that:this},this.mouseclick);
    }
    else {
        $(canvas).bind('mousedown',{that:this},this.mousedown);
        $(canvas).bind('mouseup',{that:this},this.mouseup);
        $(canvas).bind('mousemove',{that:this},this.mousemove);
        $(canvas).bind('mouseout',{that:this},this.mouseup);
        $(canvas).bind('click',{that:this},this.mouseclick);
        
    }
    this.cameraTheta = 0;
    this.cameraPhi = 0;
    this.defaultColor = [1,0,0,1];
    this.autorendering = autorendering !== undefined ? autorendering:true;
}

Drawing3D.prototype = {
    resize:function() {
        this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.w2 = this.width/2;
        this.h2 = this.height/2;
        this.context.initProjection();
        this.context.camera(this.fov,this.top,this.width/this.height,this.depth);
    },
    render:function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
        this.scene.draw(this.context);
        this.gl.flush();
    },
    stopAnimation:function() {
        this.context.animate = false;  
    },
    addObject:function(obj) {
        this.scene.appendChild(obj);  
    },
    lighting:function(intensity,direction) {
        var norm = Math.sqrt(direction[0]*direction[0]+direction[1]*direction[1]+direction[2]*direction[2]);
        this.context.lightIntensity = intensity;
        this.context.lightDirection = [direction[0]/norm,direction[1]/norm,direction[2]/norm];
    },
    mousedown:function(event) {
        var x = event.pageX-this.offsetLeft;
        var y = event.pageY-this.offsetTop;
        var that = event.data.that;
        that.mouseX = x;
        that.mouseY = y;
        that.cameraMove = true;
        
    },
    mouseup:function(event) {
        event.data.that.cameraMove = false;  
    },
    mousemove:function(event) {
        var that = event.data.that;
        var x = event.pageX-this.offsetLeft;
        var y = event.pageY-this.offsetTop;
        if( that.cameraMove) {
             that.cameraPhi += (x-that.mouseX)/that.w2*100;
             that.cameraTheta += (y-that.mouseY)/that.h2*100;
             that.context.M.rotateX((y-that.mouseY)/that.h2*100);
             that.context.M.rotateY((x-that.mouseX)/that.w2*100);
             if (that.autorendering) that.render();
             that.mouseX = x;
             that.mouseY = y;
        }
    },
    mouseclick:function(event) {
        var that = event.data.that;
        if(event.ctrlKey) {
            that.top *= 1.1;
            that.depth *= 1.1;
            that.context.P = new Matrice4();
            that.context.P.camera(that.fov,that.top,that.width/that.height,that.depth);
            if (that.autorendering) that.render();
        }
        else if (event.shiftKey) {
            that.top *= 0.9;
            that.depth *= 0.9;
            that.context.P = new Matrice4();
            that.context.P.camera(that.fov,that.top,that.width/that.height,that.depth);
            if (that.autorendering) that.render();
        }
        
    },
    
    objet3d:function() {
        return new Objet3D(this.gl,this.base)  
    },
    fplot3d:function(f,xmin,xmax,nx,ymin,ymax,ny,zmin,zmax,style) {
        var obj;
        if (style.wireframe==true){
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj = new Objet3D.MailleF(this.gl,this.base,f,xmin,xmax,nx,ymin,ymax,ny,zmin,zmax,color);   
        }
        else if (style.wire==true) {
            var width = style.width !== undefined ? style.width : 0;
            var offset = style.offset !== undefined ? style.offset : (zmax-zmin)/100;
            var hsv = style.hsv !== undefined ? style.hsv : [0,1,1];
            var hsvvar = style.hsvvar !== undefined ? style.hsvvar : 0;
            var obj = new Objet3D(this.gl,this.base);
            obj.appendChild(new Objet3D.SurfaceMailleF(this.gl,this.base,f,xmin,xmax,nx,ymin,ymax,ny,zmin,zmax,hsv,hsvvar,width));
            var f_offset = function(x,y) {return f(x,y)-offset;}
            obj.appendChild(new Objet3D.SurfaceF(this.gl,this.base,f_offset,xmin,xmax,nx,ymin,ymax,ny,zmin,zmax,[0,0,1],0));
   
        }
        else {
            var hsv = style.hsv !== undefined ? style.hsv : [0,1,1];
            var hsvvar = style.hsvvar !== undefined ? style.hsvvar : 0;
            obj = new Objet3D.SurfaceF(this.gl,this.base,f,xmin,xmax,nx,ymin,ymax,ny,zmin,zmax,hsv,hsvvar);
        }
        //this.scene.appendChild(obj);
        return obj;
    },
    matplot3d:function(mat,xmin,xmax,ymin,ymax,zmin,zmax,style) {
        var obj;
        if (style.wireframe==true){
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj = new Objet3D.MailleMat(this.gl,this.base,mat,xmin,xmax,ymin,ymax,zmin,zmax,color);   
        }
        else if (style.wire==true) {
            var width = style.width !== undefined ? style.width : 0;
            var hsv = style.hsv !== undefined ? style.hsv : [0,1,1];
            var hsvvar = style.hsvvar !== undefined ? style.hsvvar : 0;
            obj = new Objet3D.SurfaceMailleMat(this.gl,this.base,mat,xmin,xmax,ymin,ymax,zmin,zmax,hsv,hsvvar,width);   
        }
        else {
            var hsv = style.hsv !== undefined ? style.hsv : [0,1,1];
            var hsvvar = style.hsvvar !== undefined ? style.hsvvar : 0;
            obj = new Objet3D.SurfaceMat(this.gl,this.base,mat,xmin,xmax,ymin,ymax,zmin,zmax,hsv,hsvvar,width);   
        }
        return obj;
    },
    matcolorsplot3d:function(mat,matH,matS,matV,xmin,xmax,ymin,ymax,zmin,zmax,style) {
        var obj;
        obj = new Objet3D.SurfaceMatColors(this.gl,this.base,mat,matH,matS,matV,xmin,xmax,ymin,ymax);
        return obj;
    },
    fplot3d_animate:function(fsrc,xmin,xmax,nx,ymin,ymax,ny,tmin,tmax,duration,style) {
        var obj;
        this.context.time = 0.0;
        var color = style.color !== undefined ? style.color : this.defaultColor;
        obj = new Objet3D.SurfaceFanim(this.gl,this.base,fsrc,xmin,xmax,nx,ymin,ymax,ny,color);
        this.context.time = tmin;
        this.context.animate = true;
        var that = this;
        var now = +new Date();
        window.requestNextAnimationFrame(function() {that.fplot3d_animateRefresh(tmin,tmax,duration,now)});
        return obj;
    },
    fplot3d_animateRefresh:function(tmin,tmax,duration,lastTime) {
        var that = this;
        var now = +new Date();
        var fps = 1000 / (now-lastTime);
        var dt = (tmax-tmin)/(duration*fps);
        that.context.time += dt;
        if (that.context.time >= tmax) that.context.time = tmin;
        that.render();
        if (that.context.animate) window.requestNextAnimationFrame(function() {that.fplot3d_animateRefresh(tmin,tmax,duration,now)});
    },
    sphere:function(x,y,z,r,ntheta,nphi,style) {
        var obj;
        if (style.texture) {
            obj = new Objet3D.DiffuseTextureSphere(this.gl,this.base,r,ntheta,nphi,style.texture);    
        }
        else {
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj= new Objet3D.DiffuseSphere(this.gl,this.base,r,ntheta,nphi,style.color);
        }
        obj.matrix.translate(x,y,z);
        //this.scene.appendChild(s);
        return obj;
    },
    disk:function(x,y,z,r,ntheta,style) {
        var color = style.color !== undefined ? style.color : this.defaultColor;
        var obj = new Objet3D.DiffuseDisk(this.gl,this.base,r,ntheta,color);
        obj.matrix.translate(x,y,z);
        //this.scene.appendChild(obj);
        return obj;
    },
    rectangle:function(xmin,xmax,ymin,ymax,style) {
        var obj;
        if (style.texture) {
            obj = new Objet3D.DiffuseTextureRectangle(this.gl,this.base,xmin,xmax,ymin,ymax,style.texture);
        }
        else {
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj = new Objet3D.DiffuseRectangle(this.gl,this.base,xmin,xmax,ymin,ymax,color);
        }
        return obj;
    },
    text:function(canvasId,x,y,align,baseline,height,text,font,size,fill,back) {
        var obj = new Objet3D.Text(this.gl,this.base,canvasId,x,y,align,baseline,height,text,font,size,fill,back);
        return obj;
    },
    parallel:function(width,height,depth,style) {
        var obj;
        if (style.texture) {
            obj = new Objet3D.DiffuseTextureParallel(this.gl,this.base,width,height,depth,style.texture);
        }
        else {
            obj = new Objet3D.DiffuseParallel(this.gl,this.base,width,height,depth,style.hueList);
        }
        return obj;
    },
    cone:function(x,y,z,r1,r2,h,ntheta,nz,style) {
        var obj;
        if (style.texture) {
            obj = new Objet3D.DiffuseTextureCone(this.gl,this.base,r1,r2,h,ntheta,nz,style.texture);   
        }
        else {
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj = new Objet3D.DiffuseCone(this.gl,this.base,r1,r2,h,ntheta,nz,color);
        }
        obj.matrix.translate(x,y,z);
        //this.scene.appendChild(obj);
        return obj;
    },
    surfaceSTL:function(url,style) {
        var obj;
        if (style.texture) {
            
        }
        else {
            var color = style.color !== undefined ? style.color : this.defaultColor;
            obj = new Objet3D.DiffuseSurfaceSTL(this.gl,this.base,url,color);
        }
        return obj;
    },
    vector:function(x,y,z,vx,vy,vz,r,ntheta,style) {
         var obj;
         var color = style.color !== undefined ? style.color : this.defaultColor;
         obj = new Objet3D.Vector(this.gl,this.base,r,ntheta,nz)
         obj.change(x,y,z,vx,vy,vz)
         return obj
    },
    frame:function(xmin,xmax,ymin,ymax,zmin,zmax,style) {
        var color = style.color !== undefined ? style.color : this.defaultColor;
        var s = 1/Math.max(xmax-xmin,ymax-ymin,zmax-zmin);
        this.context.M.scale(s,s,s);
        this.context.M.translate(-(xmin+xmax)/2,-(ymin+ymax)/2,-(zmin+zmax)/2);
        var obj = new Objet3D.MailleParallel(this.gl,this.base,xmin,xmax,ymin,ymax,zmin,zmax,color);
        //this.scene.appendChild(obj);
        return obj;
    },
    plot3d:function(x,y,z,plotstyle,style,visibility) {
        var color = style.color !== undefined ? style.color : this.defaultColor;
        var nx = x.length, ny = y.length, nz = z.length;
        if ((nx!=ny)||(nx!=nz)) throw new Error("plot3d : incompatible array sizes");
        var obj;
        if ((plotstyle.type== "line")||(plotstyle.type===undefined)) {
            obj = new Objet3D.Ligne(this.gl,this.base,x,y,z,color);
            //this.scene.appendChild(obj);
            return obj;
        }
        if (plotstyle.type=="points") {
            var size = plotstyle.size !== undefined ? plotstyle.size : 1.0;
            obj = new Objet3D.Points(this.gl,this.base,x,y,z,size,plotstyle.texture,color);
            //this.scene.appendChild(obj);
            return obj;   
        }
        if (plotstyle.type=="clippoints") {
            var size = plotstyle.size !== undefined ? plotstyle.size : 1.0;
            obj = new Objet3D.ClipPoints(this.gl,this.base,x,y,z,visibility,size,plotstyle.texture,color);
            //this.scene.appendChild(obj);
            return obj;    
        }
    },
    pixmap:function(fsrc,xmin,xmax,ymin,ymax,origin,width,style) {
        var color = style.color !== undefined ? style.color : this.defaultColor;
        if (style.antialias == "true") {
            obj = new Objet3D.PixmapAntialias(this.gl,this.base,fsrc,xmin,xmax,ymin,ymax,origin,width,this.width,this.height,color,style.Xtexsrc,style.Ytexsrc);      
        }
        else {
            obj = new Objet3D.Pixmap(this.gl,this.base,fsrc,xmin,xmax,ymin,ymax,origin,width,this.width,this.height,color);
        }
        this.scene.appendChild(obj);
        return obj;
    },
    pixmap_animate:function(fsrc,xmin,xmax,ymin,ymax,origin,width,tmin,tmax,duration,style) {
        var color = style.color !== undefined ? style.color : this.defaultColor;
        if (style.antialias == "true") {
            obj = new Objet3D.PixmapAntialias(this.gl,this.base,fsrc,xmin,xmax,ymin,ymax,origin,width,this.width,this.height,color,style.Xtexsrc,style.Ytexsrc);      
        }
        else {
            obj = new Objet3D.Pixmap(this.gl,this.base,fsrc,xmin,xmax,ymin,ymax,origin,width,this.width,this.height,color);
        }
        this.scene.appendChild(obj);
        this.context.time = tmin;
        this.context.animate = true;
        var now = +new Date();
        var that = this;
        window.requestNextAnimationFrame(function() {that.pixmap_animateRefresh(tmin,tmax,duration,now)})
        return obj;   
    },
    pixmap_animateRefresh:function(tmin,tmax,duration,lastTime) {
        var that = this;
        var now = +new Date();
        var fps = 1000 / (now-lastTime);
        var dt = (tmax-tmin)/(duration*fps);
        that.context.time += dt;
        if (that.context.time >= tmax) that.context.time = tmin;
        that.render();
        if (that.context.animate) window.requestNextAnimationFrame(function() {that.pixmap_animateRefresh(tmin,tmax,duration,now)});
    },
    animateRefresh:function(tmin,tmax,duration,lastTime) {
        var that = this;
        var now = +new Date();
        var fps = 1000 / (now-lastTime);
        var dt = (tmax-tmin)/(duration*fps);
        that.context.time += dt;
        if (that.context.time >= tmax) {that.autorendering=true; return;}
        var n = that.animationObjectList.length;
        for (var k=0; k<n; k++) {
            var obj = that.animationObjectList[k][0];
            var matrixList = that.animationObjectList[k][1];
            obj.matrix.save();
            obj.matrix.leftMultiply(matrixList[Math.floor(that.context.time)]);
            obj.matrix.rotLeftMultiply(matrixList[Math.floor(that.context.time)]);
        }
        that.render();
        for (var k=0; k<n; k++) {
            var obj = that.animationObjectList[k][0];
            obj.matrix.restore();   
        }
        if (that.context.animate) window.requestNextAnimationFrame(function() {that.animateRefresh(tmin,tmax,duration,now)})
    },
    animate:function(objectList,tmin,tmax,duration) {
        this.context.time = tmin;
        this.animationObjectList = objectList;
        this.context.animate = true;
        //this.animateRefresh(tmin,tmax,duration);
        var that = this;
        var now = +new Date()
        window.requestNextAnimationFrame(function() {that.animateRefresh(tmin,tmax,duration,now)})
    },
    animationRefresh:function(f,tmin,tmax,duration,lastTime) {
        var that = this;
        var now = +new Date();
        var fps = 1000 / (now-lastTime);
        var dt = (tmax-tmin)/(duration*fps);
        that.context.time += dt;
        if (that.context.time < tmax) {
            f(that.context.time);
            window.requestNextAnimationFrame(function() {that.animationRefresh(f,tmin,tmax,duration,now)})
        }
        else this.autorendering = true;
    },
    animation:function(f,tmin,tmax,duration) {
        this.context.time = tmin;
        var that = this;
        var now = +new Date();
        this.autorendering = false;
        window.requestNextAnimationFrame(function() {that.animationRefresh(f,tmin,tmax,duration,now)})
    }
}