
angular.module('MyApp',['ngMaterial', 'ngMessages', 'material.svgAssetsCache'])
  .config(function($mdIconProvider) {
    $mdIconProvider
      .iconSet('device', 'img/icons/sets/device-icons.svg', 24);
  })
  
.controller('AppCtrl', function($scope) {

  $scope.params = {
    thetax: 0,
    thetay: 0,
    delta: 0,
	lambda:550,
	lightSource:0
  }
  
  $scope.scanZLabel = "Start z scan"

  $scope.refreshIntervalId = 0
  $scope.scanningZ = 0

  $scope.myMethod = function(){
	  
	  updateParams($scope.params)
	  
  }
  
  $scope.autoScanZ = function(){
	  if ($scope.scanningZ == 1){
		 clearInterval($scope.refreshIntervalId);
		 $scope.scanningZ = 0;
		 $scope.scanZLabel = "Start z scan"
	  }
	  else{
		 $scope.refreshIntervalId = setInterval(function () 
		 {
			 $scope.params.delta++
			 updateParams($scope.params)
		 }, 1/30);
		 $scope.scanningZ = 1
		 $scope.scanZLabel = "Stop z scan"
	  }
  }
  
  $scope.switchSource = function(){
	  console.log("switchSource")
	  if ($scope.params.lightSource == 2){
		  lightSource = 2
		  $scope.params.thetax = 0
		  $scope.params.thetay = 0
		  $scope.params.delta = 0
		  document.getElementsByTagName("md-slider")[0].removeAttribute("disabled")
		  document.getElementsByTagName("md-slider")[1].removeAttribute("disabled")
		  document.getElementsByTagName("md-slider")[2].setAttribute("disabled","")
		  document.getElementsByTagName("md-slider")[3].setAttribute("disabled","")
      }
	  else if ($scope.params.lightSource == 1){
		  lightSource = 1
		  $scope.params.thetax = 0
		  $scope.params.thetay = 0
		  $scope.params.delta = 0
		  $scope.params.lambda = 589
		  document.getElementsByTagName("md-slider")[0].setAttribute("disabled","")
		  document.getElementsByTagName("md-slider")[1].setAttribute("disabled","")
		  document.getElementsByTagName("md-slider")[2].removeAttribute("disabled")
		  document.getElementsByTagName("md-slider")[3].setAttribute("disabled","")
      } 	  
	  else {
		  lightSource = 0
		  for (var kk = 0; kk<4; kk++)
			  document.getElementsByTagName("md-slider")[kk].removeAttribute("disabled")
	  }
	  updateParams($scope.params)	  
  }
  
  setCanvaSize(300,300)
  updateParams($scope.params)
 
})

.directive('testDragEnd', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.on('$md.dragend', function() {
                console.log('Drag Ended');
            })
			element.on('$md.pressdown', function(){console.log('pressdown')})
			element.on('$md.drag', function(){console.log('drag')})
        }
    }
});


/**
Copyright 2016 Google Inc. All Rights Reserved. 
Use of this source code is governed by an MIT-style license that can be foundin the LICENSE file at http://material.angularjs.org/HEAD/license.
**/