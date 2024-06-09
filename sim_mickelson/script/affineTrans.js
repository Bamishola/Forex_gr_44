AffineTrans = function() {
    this.trans = [1,0,0,1,0,0];
    this.invtrans = [1,0,0,1,0,0];
    this.stack = [];
    this.invstack = [];
}

AffineTrans.prototype = {
    save:function() { this.stack.push(this.trans); this.invstack.push(this.invtrans);},
    restore:function() { this.trans = this.stack.pop(); this.invtrans = this.invstack.pop(); },
    copy:function() {
        var transform = new AffineTrans();
        transform.trans = this.trans.slice(0);
        transform.invtrans = this.invtrans.slice(0);
        return transform;
    },
    set:function(m) {
        this.trans = m;  
    },
    unity:function() {
        this.trans = this.invtrans = [1,0,0,1,0,0];
    },
    transform:function(m) {
        var t = new Array(6);
        t[0] = this.trans[0]*m[0]+this.trans[2]*m[1];
        t[1] = this.trans[1]*m[0]+this.trans[3]*m[1];
        t[2] = this.trans[0]*m[2]+this.trans[2]*m[3];
        t[3] = this.trans[1]*m[2]+this.trans[3]*m[3];
        t[4] = this.trans[0]*m[4]+this.trans[2]*m[5]+this.trans[4];
        t[5] = this.trans[1]*m[4]+this.trans[3]*m[5]+this.trans[5];
        this.trans = t;
        
    },
    invtransform:function(m) {
        var t = new Array(6);
        t[0] = this.invtrans[0]*m[0]+this.invtrans[1]*m[2];
        t[1] = this.invtrans[0]*m[1]+this.invtrans[1]*m[3];
        t[2] = this.invtrans[2]*m[0]+this.invtrans[3]*m[2];
        t[3] = this.invtrans[2]*m[1]+this.invtrans[3]*m[3];
        t[4] = this.invtrans[4]*m[0]+this.invtrans[5]*m[2]+m[4];
        t[5] = this.invtrans[4]*m[1]+this.invtrans[5]*m[3]+m[5];
        
        this.invtrans = t;  
    },
    compose:function(affineTrans) {
        this.transform(affineTrans.trans);
        this.invtransform(affineTrans.invtrans);
    },
    translate:function(tx,ty) {
        this.transform([1,0,0,1,tx,ty]);
        this.invtransform([1,0,0,1,-tx,-ty]);
    },
    scale:function(sx,sy) {
        this.transform([sx,0,0,sy,0,0]);
        this.invtransform([1/sx,0,0,1/sy,0,0]);
    },
    rotate:function(angle) {
        this.rotateRad(angle*Math.PI/180);
    },
    rotateRad:function(angle) {
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        this.transform([c,s,-s,c,0,0])
        this.invtransform([c,-s,s,c,0,0]);
    },
    apply:function(p) {
        return [this.trans[0]*p[0]+this.trans[2]*p[1]+this.trans[4],this.trans[1]*p[0]+this.trans[3]*p[1]+this.trans[5]];  
    },
    applyInverse:function(p) {
        return [this.invtrans[0]*p[0]+this.invtrans[2]*p[1]+this.invtrans[4],this.invtrans[1]*p[0]+this.invtrans[3]*p[1]+this.invtrans[5]];   
    },
    vector:function(v) {
         return [this.trans[0]*v[0]+this.trans[2]*v[1],this.trans[1]*v[0]+this.trans[3]*v[1]]; 
    },
    vectorInverse:function(v) {
         return [this.invtrans[0]*v[0]+this.invtrans[2]*v[1],this.invtrans[1]*v[0]+this.invtrans[3]*v[1]];   
    },
    x:function(x,y) {
        return this.trans[0]*x+this.trans[2]*y+this.trans[4];   
    },
    y:function(x,y) {
        return this.trans[1]*x+this.trans[3]*y+this.trans[5];   
    },
    xy:function(x,y) {
        return [this.trans[0]*x+this.trans[2]*y+this.trans[4],this.trans[1]*x+this.trans[3]*y+this.trans[5]];
    },
    rxy:function(x,y) {
        return [this.trans[0]*x+this.trans[2]*y,this.trans[1]*x+this.trans[3]*y];
    },
    points:function(ps) {
        var tps = [];
        var x,y,k;
        for (k=0; k<ps.length; k++) {
            x = ps[k][0]; y = ps[k][1];
            tps.push([this.trans[0]*x+this.trans[2]*y+this.trans[4],this.trans[1]*x+this.trans[3]*y+this.trans[5]]);
        }
        return tps;
    },
    inv:function(p) {
        var det = this.trans[0]*this.trans[3]-this.trans[1]*this.trans[2];
        if (det==0) throw new Error("Invalid operation");
        var x = p[0]-this.trans[4];
        var y = p[1]-this.trans[5];
        return([(x*this.trans[3]-y*this.trans[2])/det,(y*this.trans[0]-x*this.trans[1])/det])
    },
    
        
}