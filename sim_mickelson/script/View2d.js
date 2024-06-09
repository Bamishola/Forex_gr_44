function inheritPrototype(p) {
    if (p==null) throw TypeError();
    if (Object.create) return Object.create(p);
    var t = typeof p;
    if (t!=="object" && t !== "function") throw TypeError();
    function f() {};
    f.prototype = p;
    return new f();       
}

View2d = {}

// objet basique, avec transformation affine par rapport au conteneur
View2d.Object2d = function() {
    this.childs = Array();
    this.matrix = new AffineTrans();
    this.movable = false;
    this.visible = true;
    
}
View2d.Object2d.prototype = {
    add:function(object) {
        this.childs.push(object);   
    },
    draw:function(context2d) {
        context2d.modelview.save();
        context2d.modelview.compose(this.matrix);
        context2d.context.save();
        if (this.visible) {
            this.drawing(context2d);
            for (var k=0; k<this.childs.length; k++) {
                this.childs[k].draw(context2d);
            }
        }
        context2d.context.restore();
        context2d.modelview.restore();
    },
    drawing:function(context2d) {}, // placer ici le dessin de l'objet
    init:function() {
        this.childs = Array();
        this.matrix.unity();  
    }
}

// objet basique pour animations
View2d.AnimatedObject2d = function() {
    this.childs = Array();
    this.matrix = new AffineTrans();
    this.parentModelview = new AffineTrans();
    this.movable = false;
    this.animated = true;
    this.renderall = false; // la mise Ã  jour ne nÃ©cessite pas un retracÃ© complet du dessin
}
View2d.AnimatedObject2d.prototype = {
    add:function(object) {
        this.childs.push(object);   
    },
    draw:function(context2d) {
        context2d.modelview.save();
        this.parentModelview.set(context2d.modelview.trans);
        context2d.modelview.compose(this.matrix);
        context2d.context.save();
        this.drawing(context2d);
        for (var k=0; k<this.childs.length; k++) {
            this.childs[k].draw(context2d);
        }
        context2d.context.restore();
        context2d.modelview.restore();
    },
    drawing:function(context2d) {}, // placer ici le dessin de l'objet
    init:function() {
        this.childs = Array();
        this.matrix.unity();  
    },
    drawthis:function(context2d) {
        context2d.modelview.save();
        context2d.modelview.set(this.parentModelview.trans);
        this.draw(context2d);
        context2d.modelview.restore();
    },
    update:function(time) {
        // mise Ã  jour de l'objet en fonction du temps en secondes   
    }
}

// objet comportant une position et un angle, pouvant Ãªtre dÃ©placÃ© Ã  la souris et/ou Ãªtre animÃ©
View2d.MovableObject2d = function() {
    this.childs = Array();
    this.position = [0,0];
    this.xLimits = false;
    this.yLimits = false;
    this.xyStep = false;
    this.angle = 0.0;
    this.angleLimits = false;
    this.angleStep = false;
    this.scale = [1,1];
    this.modelview = new AffineTrans();
    this.translationModelview = new AffineTrans();
    this.parentModelview = new AffineTrans();
    this.size = 1;
    this.anchor = [0,0];
    this.rotAnchor = [0.5,0];
    this.anchorSize = 3;
    this.constraint = false;
    this.constraintAngle = 0;
    this.constraintFunction = false;
    this.movable = true; // objet dÃ©placable Ã  la souris
    this.translation = false;
    this.rotation = false;
    this.moveListener = false;
    this.renderall = true;
    this.animated = false; // objet non animÃ©
    this.visible = true;
}

View2d.MovableObject2d.prototype = {
    add:function(object) {
        this.childs.push(object);   
    },
    draw:function(context2d) {
        if (!this.visible) return;
        context2d.modelview.save();
        this.parentModelview.set(context2d.modelview.trans);
        context2d.modelview.translate(this.position[0],this.position[1]);
        this.translationModelview.set(context2d.modelview.trans);
        context2d.modelview.rotateRad(this.angle);
        context2d.modelview.scale(this.scale[0],this.scale[1]);
        this.modelview.set(context2d.modelview.trans);
        context2d.context.save();
        this.drawing(context2d);
        for (var k=0; k<this.childs.length; k++) {
            this.childs[k].draw(context2d);
        }
        context2d.context.restore();
        context2d.modelview.restore();
    },
    drawthis:function(context2d) {
        context2d.modelview.save();
        context2d.modelview.set(this.parentModelview.trans);
        this.draw(context2d);
        context2d.modelview.restore();
    },
    drawing:function(context2d) {}, // placer ici le dessin de l'objet
    clickAnchor:function(point) {
        var a = this.modelview.apply(this.anchor);
        if ((point[0]>a[0]-this.anchorSize)&&(point[0]<a[0]+this.anchorSize)&&(point[1]>a[1]-this.anchorSize)&&(point[1]<a[1]+this.anchorSize)) {
             this.translation = true;
             return true;  
        }
        a = this.modelview.apply(this.rotAnchor);
        if ((point[0]>a[0]-this.anchorSize)&&(point[0]<a[0]+this.anchorSize)&&(point[1]>a[1]-this.anchorSize)&&(point[1]<a[1]+this.anchorSize)) {
             this.rotation = true;
             return true;  
        }
        return false;
    },
    releaseAnchor:function() {
        this.translation = false;
        this.rotation = false;
    },
    move:function(point) {
        
        var dx=0, dy=0;
        if (this.translation) {
            var p = this.translationModelview.inv(point);
            if (this.constraint) {
                var c = Math.cos(this.constraintAngle);
                var s = Math.sin(this.constraintAngle);
                var t = (p[0]-this.anchor[0])*c+(p[1]-this.anchor[1])*s;
                dx = c*t;
                dy = s*t;
            }
            else if (this.constraintFunction) {
                dx = p[0]-this.anchor[0];
                dy = this.constraintFunction(this.position[0]+dx)-this.position[1];
            }
            else {
                dx = p[0]-this.anchor[0];
                dy = p[1]-this.anchor[1];
            }
            if (this.xyStep) {
                dx = Math.round(dx/this.xyStep)*this.xyStep;
                dy = Math.round(dy/this.xyStep)*this.xyStep;
            }
            var lastPosition = this.position;
            this.position[0] += dx;
            this.position[1] += dy;
            if (this.xLimits) {
                if (this.position[0]<this.xLimits[0]) this.position[0] = this.xLimits[0];
                else if  (this.position[0]>this.xLimits[1]) this.position[0] = this.xLimits[1];
            }
            if (this.yLimits) {
                if (this.position[1]<this.yLimits[0]) this.position[1] = this.yLimits[0];
                else if (this.position[1]>this.yLimits[1]) this.position[1] = this.yLimits[1];
            }
        }
        if (this.rotation) {
            var a;
            var p = this.translationModelview.inv(point);
            var x = p[0];
            var y = p[1];
            if (x==0) {
                a = Math.PI/2;
                if (y<0) a = -Math.PI/2;
            }
            else {
                a = Math.atan(y/x);
                if (x<0) a += Math.PI;
            }
            this.angle = a;
            if (this.angleLimits) {
                if (this.angle<this.angleLimits[0]) this.angle = this.angleLimits[0];
                else if (this.angle>this.angleLimits[1]) this.angle = this.angleLimits[1];
            }
        }
        if (this.renderall) {
            var xmin = Math.min(-this.size,dx-this.size);
            var xmax = Math.max(this.size,dx+this.size);
            var ymin = Math.min(-this.size,dy-this.size);
            var ymax = Math.max(this.size,dy+this.size);
            var pmin = this.translationModelview.apply([xmin,ymin]);
            var pmax = this.translationModelview.apply([xmax,ymax]);
            return [pmin[0],pmin[1],pmax[0],pmax[1]];
        }
        return false;
    },
    drawAnchor:function(context2d) {
        var p = this.modelview.apply(this.anchor);
        context2d.context.beginPath();
        context2d.context.arc(p[0],p[1],this.anchorSize,0,2*Math.PI,true);
        context2d.context.stroke();
        
    },
    drawRotAnchor:function(context2d) {
        var p = this.modelview.apply(this.rotAnchor);
        context2d.context.beginPath();
        context2d.context.arc(p[0],p[1],this.anchorSize,0,2*Math.PI,true);
        context2d.context.stroke();
    },
    getPosition:function() {
        return this.position;   
    },
    getAngle:function() {
        return this.angle;   
    },
    update:function(time) {
        // mise Ã  jour de l'objet en fonction du temps en secondes   
    },
    addEventListener:function(event,f) {
        if (event=="move") this.moveListener = f;
        if (event=="hasmoved") this.hasmovedListener = f;
    }
}
View2d.RelativePosition = function() {
    this.anchors = {'c':[0.5,0.5],'b':[0.5,0],'r':[1,0.5],'t':[0.5,1],'l':[0,0.5],'bl':[0,0],'br':[1,0],'tr':[1,1],'tl':[0,1]};
    this.offsets = {'c':[0,0],'b':[0,-1],'r':[1,0],'t':[0,1],'l':[-1,0],'bl':[-1,-1],'br':[1,-1],'tr':[1,1],'tl':[-1,1]};
}
View2d.RelativePosition.prototype = {
    getAnchorPosition:function(widget,anchor,offset) {
        var d = this.anchors[anchor];
        var o = this.offsets[anchor];
        if (d) {
            return [widget.x+widget.width*d[0]+o[0]*offset,widget.y+widget.height*d[1]+o[1]*offset];
        }
        else return [0,0];
    },
    getWidgetPosition:function(p,widget,anchor) {
        var d = this.anchors[anchor];
        if (d) {
            return [p[0]-widget.width*d[0],p[1]-widget.height*d[1]];
        }
        else return [0,0];
    }
}

View2d.Widget = function(x,y,width,height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.childs = Array();
    this.matrix = new AffineTrans();
    this.modelview = new AffineTrans();
    this.parentModelview = new AffineTrans();
    this.movable = true;
    this.clickable = false;
    this.matrix.translate(x,y);
    this.matrix.scale(width,height);
    this.background = "white";
    this.borders = false;
    this.relative = false;
    this.animated = false;
    this.renderall = false;
    this.visible = true;
}
View2d.Widget.prototype = {
    setRelativePosition:function(anchor,relativeWidget,relativeAnchor,offset) {
        this.relative = new View2d.RelativePosition();
        this.anchor = anchor;
        this.relativeWidget = relativeWidget;
        this.relativeAnchor = relativeAnchor;
        this.relativeOffset = offset;
    },
    setPosition:function() {
        var p = this.relative.getAnchorPosition(this.relativeWidget,this.relativeAnchor,this.relativeOffset);
        var xy = this.relative.getWidgetPosition(p,this,this.anchor);
        this.x = xy[0];
        this.y = xy[1];
        this.matrix.unity();
        this.matrix.translate(this.x,this.y);
        this.matrix.scale(this.width,this.height);
        this.setMatrix();  
    },
    setMatrix:function() {
        
    },
    add:function(object) {
        this.childs.push(object);   
    },
    addObject:function(obj) {
        var liste = [];
        liste = liste.concat(obj);
        for (var k=0; k<liste.length; k++) {
                this.add(liste[k]);
        }
    },
    draw:function(context2d) {
        if (this.relative) this.setPosition();
        context2d.modelview.save();
        this.parentModelview.set(context2d.modelview.trans);
        if (this.visible) {
            context2d.context.fillStyle = this.background;
            context2d.rectangle(this.x,this.y,this.width,this.height);
            if (this.borders) {
                context2d.context.strokeStyle = this.borders;
                context2d.context.stroke();   
            }
        context2d.context.fill();
        }
        context2d.modelview.compose(this.matrix);
        this.modelview.set(context2d.modelview.trans);
        context2d.context.save();
        this.drawing(context2d);
        for (var k=0; k<this.childs.length; k++) {
            this.childs[k].draw(context2d);
        }
        context2d.context.restore();
        context2d.modelview.restore();
    },
    drawthis:function(context2d) {
        context2d.modelview.save();
        context2d.modelview.set(this.parentModelview.trans);
        this.draw(context2d);
        context2d.modelview.restore();
    },
    drawing:function(context2d) {}, // placer ici le dessin de l'objet
    clickAnchor:function(point) {return false;},
    releaseAnchor:function() {},
    move:function(point) {return false},
    addEventListener:function(event,f) {
        if (event=="move") this.moveListener = f;
        if (event=="click") this.clickListener = f;
    },
    init:function() {
        this.childs = Array();
        this.matrix.unity();  
    },
    update:function(time) {
        // mise Ã  jour de l'objet en fonction du temps en secondes   
    }
    /*,
    addLabel:function(anchor,offset,font,fillStyle,text) {
           var positions = {'c':[0.5,0.5],'b':[0.5,0],'r':[1,0.5],'t':[0.5,1],'l':[0,0.5],'bl':[0,0],'br':[1,0],'tr':[1,1],'tl':[0,1]};
           var offsets = {'c':[0,0],'b':[0,-1],'r':[1,0],'t':[0,1],'l':[-1,0],'bl':[-1,-1],'br':[1,-1],'tr':[1,1],'tl':[-1,1]};
           var p = positions[anchor];
           var aligns = {'c':'center','b':'center','r':'start','t':'center','l':'end','bl':'end','br':'start','tr':'start','tl':'end'}
           var baselines = {'c':'middle','b':'top','r':'middle','t':'bottom','l':'middle','bl':'top','br':'top','tr':'bottom','tl':'bottom'}
           var label = new View2d.Label(font,fillStyle,baselines[anchor],aligns[anchor],text);
           var p = positions[anchor];
           var off = offsets[anchor];
           label.matrix.translate(p[0]+off[0]*offset,p[1]+off[1]*offset);
           this.add(label);
    }*/
    
}

View2d.Context2d = function(canvas,background,mobile) {
    this.canvas = canvas;
    
    this.context = canvas.getContext("2d");
    this.modelview = new AffineTrans();
    this.scene = new View2d.Object2d();
    this.movableObjects = [];
    this.animatedObjects = [];
    this.clickableObjects = [];
    this.background = background;
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
    this.moveObject = false;
}
View2d.Context2d.prototype = {
    init:function() {
        this.modelview.unity();
        this.scene.init();
        this.movableObjects = [];
        this.animatedObjects = [];
        this.animation = false;
    },
    viewbox:function(width,height) {
        this.modelview.unity();
        this.modelview.scale(this.canvas.width/width,this.canvas.height/height);
        this.modelview.translate(0,height);
        this.modelview.scale(1,-1);
    },
    render:function() {
          this.context.fillStyle = this.background;
          this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
          this.scene.draw(this);
    },
    clear:function() {
          this.context.fillStyle = this.background;
          this.context.fillRect(0,0,this.canvas.width,this.canvas.height);
    },
    addObject:function(obj) {
        var liste = [];
        liste = liste.concat(obj);
        for (var k=0; k<liste.length; k++) {
                this.scene.add(liste[k]);
                if (liste[k].movable) {this.movableObjects.push(liste[k]);}
                if (liste[k].animated) {this.animatedObjects.push(liste[k]);}
                if (liste[k].clickable) {this.clickableObjects.push(liste[k]);}
        }
        
    },
    addMovableObject:function(obj) { // pour les objets qui ne sont pas directement ajoutÃ©s avec la fonction prÃ©cÃ©dente
        if (obj.movable) {this.movableObjects.push(obj);}  
    },
    addAnimatedObject:function(obj) {
        if (obj.animated) {this.animatedObjects.push(obj);}  
    },
    addClickableObject:function(obj) {
        if (obj.clickable) {this.clickableObjects.push(obj);}  
    },
    moveTo:function(p) {
        var xy = this.modelview.apply(p);
        this.context.moveTo(xy[0],xy[1]);
    },
    lineTo:function(p) {
        var xy = this.modelview.apply(p);
        this.context.lineTo(xy[0],xy[1]);
    },
    polyline:function(points) {
        this.context.beginPath();
        if (points.length==0) return;
        var k = 0;
        this.moveTo(points[k]);
        for (var k=1; k<points.length; k++) {
            this.lineTo(points[k]);
        }
    },
    strokePolyline:function(points) {
        this.polyline(points);
        this.context.stroke();
    },
    polylinePlot:function(X,Y) {
        if (X.length==0) return;
        if (X.length!=X.length) return;
        this.context.beginPath();
        var k = 0;
        this.moveTo([X[0],Y[0]]);
        for (var k=1; k < X.length; k++) {
            this.lineTo([X[k],Y[k]]);
        }
    },
    strokePolylinePlot:function(X,Y) {
        this.polylinePlot(X,Y);
        this.context.stroke();
    },
    strokeDashedLine:function(p1,p2,length) {
        if (length==0) {this.strokePolyline([p1,p2]); return;}
        var deltaX = p2[0]-p1[0];
        var deltaY = p2[1]-p1[1];
        var n = Math.floor(Math.sqrt(deltaX*deltaX+deltaY*deltaY)/length);
        var x = p1[0], y=p1[1];
        var dx = deltaX/(n-1);
        var dy = deltaY/(n-1);
        for (var i=0; i<n; i++) {
            if (i%2==0) {
                this.context.beginPath();
                this.moveTo([x,y]);
                this.lineTo([x+dx,y+dy]);
                this.context.stroke();
            }
            x += dx;
            y += dy;
        }
    },
    fillPolyline:function(points) {
        this.polyline(points);
        this.context.fill();
    },
    fillText:function(s,p) {
        var xy = this.modelview.apply(p);
        this.context.fillText(s,xy[0],xy[1]);
    },
    rectangle:function(x,y,w,h) {
        this.context.beginPath();
        this.moveTo([x,y]);
        this.lineTo([x+w,y]);
        this.lineTo([x+w,y+h]);
        this.lineTo([x,y+h]);
        this.context.closePath();
    },
    rectangle_offset:function(x,y,w,h,offset) {
        var xy = this.modelview.apply([x,y]);
        this.context.beginPath();
        this.context.moveTo(xy[0]+offset,xy[1]-offset);
        xy = this.modelview.apply([x+w,y]);
        this.context.lineTo(xy[0]-offset,xy[1]-offset);
        xy = this.modelview.apply([x+w,y+h]);
        this.context.lineTo(xy[0]-offset,xy[1]+offset);
        xy = this.modelview.apply([x,y+h]);
        this.context.lineTo(xy[0]+offset,xy[1]+offset);
        this.context.closePath();  
    },
    drawImage:function(image,x,y) {
         var xy = this.modelview.apply([x,y]);
         this.context.drawImage(image,xy[0],xy[1])
    },
    mousePosition:function(event) {
        var that = event.data.that;
        var bbox = that.canvas.getBoundingClientRect();
        var x = event.clientX-bbox.left*(that.canvas.width/bbox.width);
        var y = event.clientY-bbox.top*(that.canvas.height/bbox.height);
        return that.modelview.inv([x,y]);
    },
    getMousePosition:function(event) {
        var that = event.data.that;
        var bbox = that.canvas.getBoundingClientRect();
        return [event.clientX-bbox.left*(that.canvas.width/bbox.width),event.clientY-bbox.top*(that.canvas.height/bbox.height)];
    },
    mousedown:function(event) {
        var that = event.data.that;
        var point = that.getMousePosition(event);
        //var point = [event.pageX-this.offsetLeft,event.pageY-this.offsetTop];
        for (var k=0; k<that.movableObjects.length; k++) {
            if (that.movableObjects[k].clickAnchor(point)) {
                that.moveObject = true;
                that.objectInMove = that.movableObjects[k];
                that.objectInMove.drawthis(that);
                if (that.objectInMove.moveListener) that.objectInMove.moveListener(that.objectInMove.getPosition(),that.objectInMove.getAngle());
                break;
            }
        }
        for (var k=0; k<that.clickableObjects.length; k++) {
            if (that.clickableObjects[k].clickAnchor(point)) {
                that.clickableObjects[k].drawthis(that);
                if (that.clickableObjects[k].clickListener) that.clickableObjects[k].clickListener(that.clickableObjects[k].selected);
                
            }
        }
    },
    mouseup:function(event) {
        var that = event.data.that;
        if (that.moveObject) {
            that.objectInMove.releaseAnchor();
            if (that.objectInMove.hasmovedListener) that.objectInMove.hasmovedListener(that.objectInMove.getPosition(),that.objectInMove.getAngle());
            that.moveObject = false;
        }
    },
    mousemove:function(event) {
        var that = event.data.that;
        if (that.moveObject) {
               var point = that.getMousePosition(event);
               //var point = [event.pageX-this.offsetLeft,event.pageY-this.offsetTop];
               var clip = that.objectInMove.move(point);
               if (that.objectInMove.renderall) { // retracÃ© de la scÃ¨ne entiÃ¨re
                   that.context.save();
                   that.context.beginPath();
                   that.context.moveTo(clip[0],clip[1]);
                   that.context.lineTo(clip[2],clip[1]);
                   that.context.lineTo(clip[2],clip[3]);
                   that.context.lineTo(clip[0],clip[3]);
                   that.context.closePath();
                   that.context.clip();
                   that.render();
                   that.context.restore();
               }
               else { // retracÃ© de l'objet en mouvement seulement
                   that.objectInMove.drawthis(that);
               }
               if (that.objectInMove.moveListener) that.objectInMove.moveListener(that.objectInMove.getPosition(),that.objectInMove.getAngle());
        }
    },
    mouseclick:function(event) {
        
    },
    objectMoveUpdate:function() {
           
    },
    animationRefresh:function(start,duration,renderall) {
        if (!this.animation) return;
        var now = +new Date()
        var time = (now-start)/1000;
        if ((duration>0)&&(time>duration)) return;
        for (var k=0; k<this.animatedObjects.length; k++) {
            this.animatedObjects[k].update(time);
            if (!renderall) this.animatedObjects[k].drawthis(this);
        }
        if (renderall) this.render();
        var that=this;
        window.requestNextAnimationFrame(function() {that.animationRefresh(start,duration,renderall);});
    },
    startAnimation:function(duration) {
        this.animation = true;
        var renderall = false;
        for (var k=0; k<this.animatedObjects.length; k++) {
            renderall = renderall || this.animatedObjects[k].renderall;   
        }
        var that=this;
        var start = +new Date();
        window.requestNextAnimationFrame(function() {that.animationRefresh(start,duration,renderall);});
    },
    stopAnimation:function() {
        this.animation = false;   
    }
}

View2d.Polyline = function(points,stroke,fill) {
    View2d.Object2d.call(this);
    this.points = points;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
    this.lineWidth = 1;
}
View2d.Polyline.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.Polyline.prototype.constructor = View2d.Polyline;
View2d.Polyline.prototype.drawing = function(context2d) {
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    
    context2d.strokePolyline(this.points);
    if (this.fillStyle) {
           context2d.context.fillStyle = this.fillStyle;
           context2d.context.fill();
    }
}

View2d.PolylinePlot = function(X,Y,stroke,fill) {
    View2d.Object2d.call(this);
    this.X = X;
    this.Y = Y;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
    this.lineWidth = 1;
}
View2d.PolylinePlot.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.PolylinePlot.prototype.constructor = View2d.PolylinePlot;
View2d.PolylinePlot.prototype.drawing = function(context2d) {
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    
    context2d.strokePolylinePlot(this.X,this.Y);
    if (this.fillStyle) {
           context2d.context.fillStyle = this.fillStyle;
           context2d.context.fill();
    }
}



View2d.Image = function(image,x,y) {
    View2d.Object2d.call(this);
    this.image = image
    this.x = x
    this.y = y
    visible = false
}
View2d.Image.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.Image.prototype.constructor = View2d.Image
View2d.Image.prototype.drawing = function(context2d) {
    context2d.drawImage(this.image,this.x,this.y) 
}

View2d.AnimatedPolyline = function(points,stroke,fill) {
    View2d.AnimatedObject2d.call(this);
    this.points = points;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
    this.lineWidth = 1;
}
View2d.AnimatedPolyline.prototype = inheritPrototype(View2d.AnimatedObject2d.prototype);
View2d.AnimatedPolyline.prototype.constructor = View2d.AnimatedPolyline;
View2d.AnimatedPolyline.prototype.drawing = function(context2d) {
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.strokePolyline(this.points);
    if (this.fillStyle) {
           context2d.context.fillStyle = this.fillStyle;
           context2d.context.fill();
    }
}



View2d.Circle = function(r,n,stroke,fill) {
    var da = Math.PI*2/(n-1);
    var points = new Array(n);
    var a = 0;
    for (var k=0; k<n; k++) {
        points[k] = [r*Math.cos(a),r*Math.sin(a),0];
        a += da;
    }
    View2d.Polyline.call(this,points,stroke,fill);
}
View2d.Circle.prototype = inheritPrototype(View2d.Polyline.prototype);
View2d.Circle.prototype.constructor = View2d.Circle;

View2d.Label = function(font,fillStyle,textBaseline,textAlign,value) {
    View2d.Object2d.call(this);
    this.font = font;
    this.fillStyle = fillStyle;
    this.textBaseline = textBaseline;
    this.textAlign = textAlign;
    if( value) this.value = value;
    else this.value = "";
}
View2d.Label.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.Label.prototype.constructor = View2d.Label;
View2d.Label.prototype.setValue = function(value) {
    this.value = value;   
}
View2d.Label.prototype.drawing = function(context2d) {
    context2d.context.font = this.font;
    context2d.context.textBaseline = this.textBaseline;
    context2d.context.textAlign = this.textAlign;
    context2d.context.fillStyle = this.fillStyle;
    context2d.fillText(""+this.value,[0,0]);
}

View2d.Arrow = function(length,begin,end,size,strokeStyle,legend,font,pos,offset) {
    View2d.MovableObject2d.call(this);
    this.begin = begin;
    this.end = end;
    this.strokeStyle = strokeStyle;
    this.font = font;
    this.legend = legend;
    this.size = size;
    this.length = length;
    this.pos = pos;
    this.offset = offset;
    this.lineWidth = 1;
}
View2d.Arrow.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.Arrow.prototype.constructor = View2d.Arrow;
View2d.Arrow.prototype.drawing = function(context2d) {
    if (this.length==0) return;
    var sens = 1;
    if (this.length<0) sens = -1; 
    this.pb = [0,0];
    this.pe = [this.length,0];
    var s2 = this.size/2;
    this.pb1 = [this.size*sens,s2];
    this.pb2 = [this.size*sens,-s2];
    this.pe1 = [this.length-this.size*sens,s2];
    this.pe2 = [this.length-this.size*sens,-s2];
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.fillStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.strokePolyline([this.pb,this.pe]);
    if (this.begin) context2d.strokePolyline([this.pb1,this.pb,this.pb2]);
    if (this.end) context2d.strokePolyline([this.pe1,this.pe,this.pe2]);
    if (this.legend!==undefined) {
        context2d.context.font = this.font;
        switch(this.pos) {
        case "head":
            context2d.context.textAlign = "center";
            context2d.context.textBaseline = "middle";
            context2d.fillText(this.legend,[this.length+this.offset*sens,0]);
            break;
        case "middle":
            this.textAlign = "center";
            this.textBaseline = "bottom";
            context2d.fillText(this.legend,[length/2,0]);
        }
    }
}
View2d.Arrow.prototype.setLength = function(l) {
    this.length = l;   
}
View2d.Arrow.prototype.setComponents = function(x,y) {
    this.length = Math.sqrt(x*x+y*y);
        var a;
        if (x!=0) a = Math.atan(y/x);
        else {
            if (y>0) a = Math.PI/2;
            else a = -Math.PI/2;
        }
        if (x<0) a += Math.PI;
        this.angle = a;   
}

View2d.Plot = function(xmin,xmax,ymin,ymax,x,y,width,height,stroke,fill) {
     View2d.Widget.call(this,x,y,width,height);
     this.xmin = xmin;
     this.xmax = xmax;
     this.ymin = ymin;
     this.ymax = ymax;
     this.setMatrix();
     this.strokeStyle = stroke;
     this.fillStyle = fill;
     this.animated = false;
     this.renderall = true;
}
View2d.Plot.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.Plot.prototype.constructor = View2d.Plot;
View2d.Plot.prototype.setMatrix= function() {
     this.matrix.scale(1/(this.xmax-this.xmin),1/(this.ymax-this.ymin));
     this.matrix.translate(-this.xmin,-this.ymin);  
}
View2d.Plot.prototype.setRange = function(xmin,xmax,ymin,ymax) {
     this.xmin = xmin;
     this.xmax = xmax;
     this.ymin = ymin;
     this.ymax = ymax;
     this.matrix.unity();
     this.matrix.translate(this.x,this.y);
     this.matrix.scale(this.width,this.height);
     this.setMatrix();
}
View2d.Plot.prototype.clearBox = function(context2d) {
     context2d.rectangle_offset(this.xmin,this.ymin,this.xmax-this.xmin,this.ymax-this.ymin,1);
     context2d.context.fillStyle = this.fillStyle;
     context2d.context.fill();
}
View2d.Plot.prototype.clipBox = function(context2d) {
     context2d.rectangle_offset(this.xmin,this.ymin,this.xmax-this.xmin,this.ymax-this.ymin,1);
     context2d.context.clip();
}
View2d.Plot.prototype.strokeBox = function(context2d) {
     context2d.rectangle(this.xmin,this.ymin,this.xmax-this.xmin,this.ymax-this.ymin);
     context2d.context.strokeStyle = this.strokeStyle;
     context2d.context.stroke()   
}
View2d.Plot.prototype.drawing = function(context2d) {
    this.clearBox(context2d);
    this.strokeBox(context2d);
}
View2d.Plot.prototype.update = function(time) {
     for (var k=0; k<this.childs.length; k++) if (this.childs[k].animated) this.childs[k].update(time); 
}

View2d.xAxis = function(xmin,xmax,y,deltaX,precision,font,stroke,fill) {
    View2d.Object2d.call(this);
    this.xmin = xmin;
    this.xmax = xmax;
    this.y = y;
    this.deltaX = deltaX;
    this.precision = precision;
    this.font = font;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
    this.legendOffset = 5;
    this.tickLength = -5;
}
View2d.xAxis.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.xAxis.prototype.constructor = View2d.xAxis;
View2d.xAxis.prototype.drawing = function(context2d) {
    context2d.context.beginPath();
    context2d.moveTo([this.xmin,this.y]);
    context2d.lineTo([this.xmax,this.y]);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.fillStyle = this.fillStyle;
    context2d.context.font = this.font;
    context2d.context.stroke();
    var x = this.xmin;
    var s,xy;
    while (x<=this.xmax) {
          s = x.toPrecision(this.precision);
          context2d.context.beginPath();
          xy = context2d.modelview.apply([x,this.y]);
          context2d.context.moveTo(xy[0],xy[1]);
          context2d.context.lineTo(xy[0],xy[1]+this.tickLength);
          context2d.context.stroke();
          context2d.context.textAlign = "center";
          context2d.context.textBaseline = "top";
          context2d.context.fillText(s,xy[0],xy[1]+this.legendOffset);
          x += this.deltaX;
    }
    
}
View2d.xAxis.prototype.setScale = function(xmin,xmax,deltaX) {
    this.xmin = xmin;
    this.xmax = xmax;
    this.deltaX = deltaX; 
}

View2d.yAxis = function(ymin,ymax,x,deltaY,precision,font,stroke,fill) {
    View2d.Object2d.call(this);
    this.ymin = ymin;
    this.ymax = ymax;
    this.x = x;
    this.deltaY = deltaY;
    this.precision = precision;
    this.font = font;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
    this.legendOffset = 5;
    this.tickLength = -5;
}
View2d.yAxis.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.yAxis.prototype.constructor = View2d.yAxis;
View2d.yAxis.prototype.drawing = function(context2d) {
    context2d.context.beginPath();
    context2d.moveTo([this.x,this.ymin]);
    context2d.lineTo([this.x,this.ymax]);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.fillStyle = this.fillStyle;
    context2d.context.font = this.font;
    context2d.context.stroke();
    var y = this.ymin;
    var s,xy;
    while (y<=this.ymax) {
          s = y.toPrecision(this.precision);
          context2d.context.beginPath();
          xy = context2d.modelview.apply([this.x,y]);
          context2d.context.moveTo(xy[0],xy[1]);
          context2d.context.lineTo(xy[0]-this.tickLength,xy[1]);
          context2d.context.stroke();
          context2d.context.textAlign = "right";
          context2d.context.textBaseline = "middle";
          context2d.context.fillText(s,xy[0]-this.legendOffset,xy[1]);
          y += this.deltaY;
    }
    
}
View2d.yAxis.prototype.setScale = function(ymin,ymax,deltaY) {
    this.ymin = ymin;
    this.ymax = ymax;
    this.deltaY = deltaY; 
}


View2d.XYCurve = function(plot,x,y,strokeStyle,lineWidth,legend,font) {
    if (x.length!=y.length) throw new Error("Incompatible array length");
     View2d.Object2d.call(this);
     this.plot = plot
     var points = [];
     for (var k=0; k<x.length; k++) points.push([x[k],y[k]]);
     var line = new View2d.Polyline(points,strokeStyle);
     line.lineWidth = lineWidth;
     this.add(line);
     if (legend) {
         var leg = new View2d.Label(font,strokeStyle,"bottom","right");
         leg.setValue(legend);
         leg.matrix.translate(x[x.length-1],y[x.length-1]);
        this.add(leg);   
     }
     
}
View2d.XYCurve.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.XYCurve.prototype.constructor = View2d.XYCurve;
View2d.XYCurve.prototype.drawing = function(context2d) {
    this.plot.clipBox(context2d);   
}

View2d.XYStem = function(plot,x,y,origin,strokeStyle,lineWidth) {
    View2d.Object2d.call(this);
    this.plot = plot
    for (var k=0; k<x.length; k++) {
        var line = new View2d.Polyline([[x[k],origin],[x[k],y[k]]],strokeStyle);
        line.lineWidth = lineWidth;
        this.add(line);
    }
}
View2d.XYStem.prototype = inheritPrototype(View2d.Object2d.prototype);
View2d.XYStem.prototype.constructor = View2d.XYStem;
View2d.XYStem.prototype.drawing = function(context2d) {
    this.plot.clipBox(context2d);   
}

View2d.AnimatedXYCurve = function(plot,xmin,xmax,np,strokeStyle,lineWidth) {
    View2d.AnimatedObject2d.call(this);
    this.plot = plot;
    this.xmin = xmin;
    this.xmax = xmax;
    this.np = np;
    this.dx = (xmax-xmin)/(this.np-1);
    this.strokeStyle = strokeStyle;
    this.lineWidth = lineWidth;
    this.renderall = true;
    this.points = [];
}
View2d.AnimatedXYCurve.prototype = inheritPrototype(View2d.AnimatedObject2d.prototype);
View2d.AnimatedXYCurve.prototype.constructor = View2d.AnimatedXYCurve;
View2d.AnimatedXYCurve.prototype.f = function(x,t) {return 0;}
View2d.AnimatedXYCurve.prototype.update = function(time) {
    this.points = [];
    var x = this.xmin;
    for (var k=0; k<this.np; k++) {
        this.points.push([x,this.f(x,time)]);
        x += this.dx;
    }
}
View2d.AnimatedXYCurve.prototype.drawing = function(context2d) {
    this.plot.clipBox(context2d);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.strokePolyline(this.points);
}

View2d.SignalCurve = function(plot,xmin,xmax,np,strokeStyle,lineWidth) {
    View2d.AnimatedObject2d.call(this);
    this.plot = plot;
    this.xmin = xmin;
    this.xmax = xmax;
    this.np = np;
    this.dx = (xmax-xmin)/(this.np-1);
    this.strokeStyle = strokeStyle;
    this.lineWidth = lineWidth;
    this.renderall = true;
    this.first = 0;
    this.last = 0;
    this.full = false;
    this.values = new Array(np);
    this.xarray = new Array(np);
    var x = this.xmin;
    for (var k=0; k<this.np; k++) {
        this.values[k] = 0.0;
        this.xarray[k] = x;
        x += this.dx;
    }
    this.lastTime = 0;
    this.lastX = xmin;
}
View2d.SignalCurve.prototype = inheritPrototype(View2d.AnimatedObject2d.prototype);
View2d.SignalCurve.prototype.constructor = View2d.SignalCurve;
View2d.SignalCurve.prototype.f = function(x) {
    return 0.0;   
}
View2d.SignalCurve.prototype.addPoint = function() {
        this.last++;
        if (this.last>=this.np) {
            this.last = 0;
            this.full = true;
        }
        if (this.full) this.first++;
        if (this.first>=this.np) this.first = 0;
        this.values[this.last] = this.f(this.lastX);
        this.lastX += this.dx;  
}
View2d.SignalCurve.prototype.update = function(time) {
    var dt = time-this.lastTime;
    this.lastTime = time;
    while (this.lastX < time) this.addPoint();
}
View2d.SignalCurve.prototype.drawing = function(context2d) {
    this.plot.clipBox(context2d);
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.context.lineWidth = this.lineWidth;
    context2d.context.beginPath();
    var i = this.first;
    context2d.moveTo([this.xarray[0],this.values[i]]);
    var n;
    if (this.full) n = this.np;
    else n = this.last-this.first;
    for (var k=1; k<n; k++) {
        i += 1;
        if (i>=this.np) i = 0;
        context2d.lineTo([this.xarray[k],this.values[i]]);
    }
    context2d.context.stroke();
}


View2d.MovablePointer = function(size) {
    View2d.MovableObject2d.call(this);
    this.anchor = [0,0];
    this.anchorSize = size;
    this.strokeStyle = "black";
    this.size = size;
}
View2d.MovablePointer.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.MovablePointer.prototype.constructor = View2d.MovablePointer;
View2d.MovablePointer.prototype.drawing = function(context2d) {
       context2d.context.strokeStyle = this.strokeStyle;
       this.drawAnchor(context2d);
}

View2d.MovableRectangle = function(width,height) {
    View2d.MovableObject2d.call(this);
    this.anchor = [0,0];
    this.anchorSize = 10;
    this.rotAnchor = [width/2,0];
    this.rotAnchorSize = this.anchorSize;
    this.w2 = width/2;
    this.h2 = height/2;
    this.strokeStyle = "black";
    this.size = Math.max(width,height);
    
}
View2d.MovableRectangle.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.MovableRectangle.prototype.constructor = View2d.MovableRectangle;
View2d.MovableRectangle.prototype.drawing = function(context2d) {
       context2d.context.strokeStyle = this.strokeStyle;
       context2d.strokePolyline([[-this.w2,-this.h2],[this.w2,-this.h2],[this.w2,this.h2],[-this.w2,this.h2],[-this.w2,this.h2],[-this.w2,-this.h2]]);
       this.drawAnchor(context2d);
       this.drawRotAnchor(context2d);
}

View2d.MovableVector = function(width,height,head) {
    View2d.MovableObject2d.call(this);
    this.anchor = [0,0];
    this.anchorSize = 10;
    this.rotAnchor = [width/2,0];
    this.rotAnchorSize = this.anchorSize;
    this.w2 = width/2;
    this.h2 = height/2;
    this.strokeStyle = "black";
    this.lineWidth = 1
    this.size = Math.max(width,height);
    this.head = head;
    
}
View2d.MovableVector.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.MovableVector.prototype.constructor = View2d.MovableVector;
View2d.MovableVector.prototype.drawing = function(context2d) {
       context2d.context.strokeStyle = this.strokeStyle;
       context2d.context.lineWidth = this.lineWidth;
       context2d.strokePolyline([[0,0],[this.w2,0]])
       context2d.strokePolyline([[this.w2,0],[this.w2-this.head,this.head/2]])
       context2d.strokePolyline([[this.w2,0],[this.w2-this.head,-this.head/2]])
       this.drawAnchor(context2d);
       this.drawRotAnchor(context2d);
}

View2d.XSliderPointer = function(size) {
    View2d.MovableObject2d.call(this);
    this.anchor = [0,0];
    this.anchorSize = size;
    this.fillStyle = "black";
    this.size = size;
}
View2d.XSliderPointer.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.XSliderPointer.prototype.constructor = View2d.XSliderPointer;
View2d.XSliderPointer.prototype.drawing = function(context2d) {
       context2d.context.fillStyle = this.fillStyle;
       var p = context2d.modelview.apply([0,0]);
       context2d.context.beginPath();
       context2d.context.moveTo(p[0],p[1]);
       context2d.context.lineTo(p[0]+this.anchorSize,p[1]-this.anchorSize);
       context2d.context.lineTo(p[0]-this.anchorSize,p[1]-this.anchorSize);
       context2d.context.closePath();
       context2d.context.fill();
}
View2d.YSliderPointer = function(size) {
    View2d.MovableObject2d.call(this);
    this.anchor = [0,0];
    this.anchorSize = size;
    this.fillStyle = "black";
    this.size = size;
}
View2d.YSliderPointer.prototype = inheritPrototype(View2d.MovableObject2d.prototype);
View2d.YSliderPointer.prototype.constructor = View2d.YSliderPointer;
View2d.YSliderPointer.prototype.drawing = function(context2d) {
       context2d.context.fillStyle = this.fillStyle;
       var p = context2d.modelview.apply([0,0]);
       context2d.context.beginPath();
       context2d.context.moveTo(p[0],p[1]);
       context2d.context.lineTo(p[0]+this.anchorSize,p[1]+this.anchorSize);
       context2d.context.lineTo(p[0]+this.anchorSize,p[1]-this.anchorSize);
       context2d.context.closePath();
       context2d.context.fill();
}
View2d.XSlider = function(x,y,width,height,min,max,value,step,size) {
       View2d.Widget.call(this,x,y,width,height);
       this.x = x;
       this.y = y;
       this.width = width;
       this.height = height;
       this.min = min;
       this.max = max;
       this.step = step;
       this.value = value;
       this.precision = Math.max(Math.abs(Math.round(Math.log(Math.abs(max-min)/100))));
       if (step!=0) this.precision = Math.max(Math.abs(Math.round(Math.log(Math.abs(step)))));
       this.setMatrix();
       this.strokeStyle = "black";
       this.background = "white";
       this.pointer = new View2d.XSliderPointer(size);
       this.pointer.position = [value,0];
       this.pointer.constraint = true;
       this.pointer.constraintAngle = 0;
       this.pointer.xLimits = [min,max];
       this.pointer.xyStep = step;
       this.add(this.pointer);
       
       this.renderall = false;
       
}
View2d.XSlider.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.XSlider.prototype.constructor = View2d.XSlider;
View2d.XSlider.prototype.setMatrix = function() {
       this.matrix.translate(0.1,0.5);
       this.matrix.scale(0.8/(this.max-this.min),1);
       this.matrix.translate(-this.min,0);
}
View2d.XSlider.prototype.move = function(point) {
    return this.pointer.move(point);   
}
View2d.XSlider.prototype.clickAnchor = function(point) {
      var p = this.parentModelview.inv(point);
      var p0 = this.modelview.inv(point);
      if ((p0[0]>this.min)&&(p0[0]<this.max)&&(p[1]>this.y)&&(p[1]<this.y+this.height)) {
          this.pointer.position = [p0[0],0];
          this.pointer.translation = true;
          return true;
      }
      return false;
}
View2d.XSlider.prototype.releaseAnchor = function() {
      this.pointer.releaseAnchor();
}
View2d.XSlider.prototype.drawing = function(context2d) {
     
     context2d.context.strokeStyle = this.strokeStyle;
     context2d.strokePolyline([[this.min,0],[this.max,0]]);
}
View2d.XSlider.prototype.getPosition = function() {
    var x = Math.pow(10,this.precision);
    return Math.round(this.pointer.position[0]*x)/x;   
}
View2d.XSlider.prototype.getAngle = function() {
    return 0;   
}
View2d.YSlider = function(x,y,width,height,min,max,value,step,size) {
       View2d.Widget.call(this,x,y,width,height);
       this.x = x;
       this.y = y;
       this.width = width;
       this.height = height;
       this.min = min;
       this.max = max;
       this.step = step;
       this.value = value;
       this.precision = Math.max(Math.abs(Math.round(Math.log(Math.abs(max-min)/100))));
       if (step!=0) this.precision = Math.max(Math.abs(Math.round(Math.log(Math.abs(step)))));
       this.setMatrix();
       this.strokeStyle = "black";
       this.background = "white";
       this.pointer = new View2d.YSliderPointer(size);
       this.pointer.position = [0,value];
       this.pointer.constraint = true;
       this.pointer.constraintAngle = Math.PI/2;
       this.pointer.yLimits = [min,max];
       this.pointer.xyStep = step;
       this.add(this.pointer);
       
       this.renderall = false;
       
}
View2d.YSlider.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.YSlider.prototype.constructor = View2d.YSlider;
View2d.YSlider.prototype.setMatrix = function(){
      this.matrix.translate(0.5,0.1);
      this.matrix.scale(1,0.8/(this.max-this.min));
      this.matrix.translate(0,-this.min); 
}
View2d.YSlider.prototype.move = function(point) {
    return this.pointer.move(point);   
}
View2d.YSlider.prototype.clickAnchor = function(point) {
      var p = this.parentModelview.inv(point);
      var p0 = this.modelview.inv(point);
      if ((p0[1]>this.min)&&(p0[1]<this.max)&&(p[0]>this.x)&&(p[0]<this.x+this.width)) {
          this.pointer.position = [0,p0[1]];
          this.pointer.translation = true;
          return true;
      }
      return false;
}
View2d.YSlider.prototype.releaseAnchor = function() {
      this.pointer.releaseAnchor();
}
View2d.YSlider.prototype.drawing = function(context2d) {
     
     context2d.context.strokeStyle = this.strokeStyle;
     context2d.strokePolyline([[0,this.min],[0,this.max]]);
}
View2d.YSlider.prototype.getPosition = function() {
    var x = Math.pow(10,this.precision);
    return Math.round(this.pointer.position[1]*x)/x;   
}
View2d.YSlider.prototype.getAngle = function() {
    return 0;   
}
View2d.Value = function(x,y,width,height,font,name,value) {
     View2d.Widget.call(this,x,y,width,height);
     this.font = font;
     this.fillStyle = "black";
     this.name = name;
     this.value = value;
     this.precision = 2;
     this.ratio = width/height;
     this.movable = false;
     this.renderall = false;
}
View2d.Value.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.Value.prototype.constructor = View2d.Value;
View2d.Value.prototype.drawing = function(context2d) {
     var s = this.name;
     if (this.value.toPrecision) s += this.value.toPrecision(this.precision);
     else s += this.value;
     var h = 10;
     var m = context2d.context.font = h+"px "+this.font;
     var w = context2d.context.measureText(s).width;
     var v0 = context2d.modelview.apply([0,0]);
     var v1 = context2d.modelview.apply([1,1]);
     var size;
     if (w/h < this.ratio) {
         size = Math.round((Math.abs(v1[1]-v0[1]))*10/h);
     }
     else {
         size = Math.round((Math.abs(v1[0]-v0[0]))*10/w);
     }
     context2d.context.font = size+"px "+this.font;
     context2d.context.textAlign = "center";
     context2d.context.textBaseline = "middle";
     context2d.context.fillStyle = this.fillStyle;
     context2d.fillText(s,[0.5,0.5]);
}
View2d.Value.prototype.changeValue = function(context2d,v) {
    this.value = v;
    this.drawthis(context2d);
    this.movable = true; // pour recevoir les Ã©vÃ¨nements souris
}

View2d.CheckBox = function(x,y,width,selected,value) {
    View2d.Widget.call(this,x,y,width,width);
    this.selected = selected;
    this.strokeStyle = "black";
    this.movable = false;
    this.clickable = true;
    this.checkbox = true;
    this.value = value;
    
}
View2d.CheckBox.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.CheckBox.prototype.constructor = View2d.CheckBox;
View2d.CheckBox.prototype.drawing = function(context2d) {
    context2d.context.strokeStyle = this.strokeStyle;
    context2d.rectangle(0,0,1,1);
    context2d.context.stroke();
    var a = 0.3;
    if (this.selected) {
        context2d.strokePolyline([[0.5-a,0.5-a],[0.5+a,0.5+a]]);
        context2d.strokePolyline([[0.5-a,0.5+a],[0.5+a,0.5-a]]);
    }
}
View2d.CheckBox.prototype.clickAnchor = function(point) {
    var p = this.modelview.inv(point);
    if ((p[0]>0)&&(p[0]<1)&&(p[1]>0)&(p[1]<1)) {
        this.selected = !this.selected;
        return true;
    }
    return false;
}

View2d.CheckBoxGroup = function() {
    View2d.Widget.call(this,0,0,1,1);
    this.movable = false;
    this.clickable = true;
    this.visible = false;
    
}
View2d.CheckBoxGroup.prototype = inheritPrototype(View2d.Widget.prototype);
View2d.CheckBoxGroup.prototype.constructor = View2d.CheckBoxGroup;
View2d.CheckBoxGroup.prototype.clickAnchor = function(point) {
    var check,check1;
    for (var k=0; k<this.childs.length; k++) {
        check = this.childs[k];
        if (check.checkbox) {
            if (check.clickAnchor(point)) {
                check.selected = true;
                if (this.changeListener) this.changeListener(check.value);
                    for (var l=0; l<this.childs.length; l++) {
                        check1 = this.childs[l];
                        if ((k!=l)&&(check1.checkbox)) {
                           check1.selected = false;
                        }
                    }
                return true;
            }
        }
    }
    return false;
}
View2d.CheckBoxGroup.prototype.addEventListener = function(event,f) {
    if (event=="change") this.changeListener = f;   
}