    Michelson = {
      deltaSM: 250,
      deltaML: 450,
      delta: 0.0,
      deltaAbsMax: 1,
      thetaX: 0,
      deltaAbsThetaX: 0.0005,
      thetaY: 0,
      deltaAbsThetaY: 0.0005,
      focalLength: 100,
      deltaLS: 100,
      screenRadius: 10,



      getOPDInMicrons: function(xScreen,yScreen){

        return this.calc({x:Math.atan(xScreen/this.focalLength),y:Math.atan(yScreen/this.focalLength)})*1000

      },

      calc: function(t2O,t2M){

      	//orientation initiale des rayons
      	var t2S1 = {x:-t2O.x,y:-t2O.y}
      	var t2S2 = {x:-t2O.x+2*this.thetaX,y:-t2O.y+2*this.thetaY}

      	//points d'intersection avec les miroirs
      	var zi1 = this.deltaSM
      	var zi2 = (this.deltaSM+this.delta)/(1+Math.tan(t2S2.x)*Math.tan(this.thetaX)+Math.tan(t2S2.y)*Math.tan(this.thetaY))

      	var ps = {x:0,y:0,z:0}
      	var v1 = {x:zi1*Math.tan(t2S1.x),y:zi1*Math.tan(t2S1.y),z:zi1}
      	var v2 = {x:zi2*Math.tan(t2S2.x),y:zi2*Math.tan(t2S2.y),z:zi2}

      	//plan perpendiculaire au rayon
      	var beta1 = -Math.tan(t2O.x)
      	var beta2 = -Math.tan(t2O.y)

      	var a2x = Math.tan(t2O.x)
      	var b2x = v2.x-v2.z*Math.tan(t2O.x)
      	var a2y = Math.tan(t2O.y)
      	var b2y = v2.y-v2.z*Math.tan(t2O.y)

      	var a1x = Math.tan(t2O.x)
      	var b1x = v1.x-v1.z*Math.tan(t2O.x)
      	var a1y = Math.tan(t2O.y)
      	var b1y = v1.y-v1.z*Math.tan(t2O.y)

      	var z1 = (beta1*b1x+beta2*b1y)/(1-beta1*a1x-beta2*a1y)
      	var z2 = (beta1*b2x+beta2*b2y)/(1-beta1*a2x-beta2*a2y)

      	var v1p = {x:v1.x+(z1-v1.z)*Math.tan(t2O.x),y:v1.y+(z1-v1.z)*Math.tan(t2O.y),z:z1}
      	var v2p = {x:v2.x+(z2-v2.z)*Math.tan(t2O.x),y:v2.y+(z2-v2.z)*Math.tan(t2O.y),z:z2}

      	return this.dist(ps,v1)+this.dist(v1,v1p)-this.dist(ps,v2)-this.dist(v2,v2p)

      },

      dist: function(v1,v2){

      	return Math.sqrt(Math.pow(v2.x-v1.x,2)+Math.pow(v2.y-v1.y,2)+Math.pow(v2.z-v1.z,2))

      },

      setDelta: function(val){

        this.delta = val

      },

      setThetaX: function(val){

        this.thetaX = val

      },

      setThetaY: function(val){

        this.thetaY = val

      }

    }

    var Nx,Ny,Nx1D
    var canva = document.getElementById('canva')
    var ctx = canva.getContext('2d')

    //var Source1 = {x:0, y:10}
    //var Source2 = {x:0, y:-10}
    var wavelength = 0.6 //Âµm
    var imgData
    //var Phase = []

    var sourcePts = [{theta: 0, phaseShift: 0}]

    var currentRGB = nmToRGBNorm(633)

    var lightSource = 0

    ctx.clearRect(0, 0, Nx, Ny)

    //for (var o = 0; o < 100; o++) Phase.push(o/100)

    function pxToMm(x){
      return (x-Nx/2)*2*Michelson.screenRadius/Nx
    }

    function setWavelength(newWavelength){
      currentRGB = nmToRGBNorm(newWavelength)
      wavelength = newWavelength/1000
    }

    function setCanvaSize(width,height){
      Nx = width
      Ny = height
      Nx1D = 0
      canva.setAttribute('height',height)
      canva.setAttribute('width',width+Nx1D)
      putCanvaInImgData()
    }

    function putCanvaInImgData(){
      imgData= ctx.getImageData(0,0,Nx,Ny)
    }

	function updateParams(params){

		Michelson.setThetaX(params.thetax/1000/1000)
		Michelson.setThetaY(params.thetay/1000/1000)
		Michelson.setDelta(params.delta/100000)
		setWavelength(params.lambda)
		updateDrawing()
		updateSVG()

  }

	function updateSVG(){

		document.getElementById("Miroir2").setAttribute("transform","translate(0,"+Math.round(Michelson.delta*50).toString()+")")

	}

    function updateDrawing(){
      var delta, myRGB
      ctx.clearRect(0,0,Nx+Nx1D,Ny)
       for (var j = 0; j < Ny; j++){
          for (var i = 0; i < Nx; i++){
            if (Math.pow(i-Nx/2,2)+Math.pow(j-Ny/2,2)<=Math.pow(Nx/2,2)){
              delta = Michelson.getOPDInMicrons(pxToMm(i),pxToMm(j))
              if (lightSource == 2){
				myRGB = getRGBFromChanneledSpectrum.getRGBFromOPD(delta*1000)
				imgData.data[(j*Nx+i)*4] = myRGB[0]
				imgData.data[(j*Nx+i)*4+1] = myRGB[1]
				imgData.data[(j*Nx+i)*4+2] = myRGB[2]
              } 
			  else if(lightSource == 1)
			  {
					setWavelength(589)
					localIntensity = getIntensity(delta)
				    setWavelength(589.6)
					localIntensity = (localIntensity+getIntensity(delta))/2
					for (var k = 0; k<3; k++) imgData.data[(j*Nx+i)*4+k] = Math.round(localIntensity*currentRGB[k])
			  }
              else {
                localIntensity = getIntensity(delta)
                for (var k = 0; k<3; k++) imgData.data[(j*Nx+i)*4+k] = Math.round(localIntensity*currentRGB[k])
              }
		      imgData.data[(j*Nx+i)*4+3] = 255
            } else {
			  imgData.data[(j*Nx+i)*4+3] = 0
			}

  		}
  	  }
  	  ctx.putImageData(imgData, 0, 0)
    }


    function intToCoord(val){
      return Nx+val/255*Nx1D
    }

    function getIntensity(delta){
      myInt = 0
      nbSources = sourcePts.length
      for(var i = 0; i<nbSources;i++){
        myPhase = Math.PI*2*delta/wavelength+sourcePts[i].phaseShift
        myInt += (1+Math.cos(myPhase))
      }
      return Math.round(127*myInt/nbSources)
    }

    function getParamValueSlider(numSlider,idSlider){
    	var rval
    	if(!idSlider) idSlider = "slider"+numSlider.toString()

    	if(idSlider == "slider0") {
        rval = ($( "#"+idSlider).slider("option","value"))/100
        Michelson.setDelta(rval)
        updateDrawing()
      }
      else if (idSlider == "slider1"){
         rval = (($( "#"+idSlider ).slider("option","value")))/100
         Michelson.setThetaX(rval)
         updateDrawing()
      }
      else if (idSlider == "slider2") {
        rval = ($( "#"+idSlider ).slider("option","value"))/100
        Michelson.setThetaY(rval)
        updateDrawing()
    	}
      else if (idSlider == "slider3") {
        rval = ($( "#"+idSlider ).slider("option","value"))/100
        setWavelength(rval)
        updateDrawing()
    	}
      else if (idSlider == "slider4") rval = Math.round(($( "#"+idSlider ).slider("option","value"))/2)

    	return rval
    }