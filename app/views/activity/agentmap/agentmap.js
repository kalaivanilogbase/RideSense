define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('carmap', ['$compile', '$rootScope', '$scope', '$routeParams', '$location', 'config', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', 'utility', carmap]);
        function carmap($compile, $rootScope, $scope, $routeParams, $location, config, spinner, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice, utility) {
        	$rootScope.routeSelection = 'live'
	        var vm = this;
	        var mapinstance;
			var infowindow;
			var ref;
			var distanceref;
			vm.isUP = true;
			
		 	vm.distanceCovered = 0;
		 	vm.showmaps =false;
			vm.mapOptions = {
                disableDefaultUI:true,    
            }

			activate();

		 	function activate(){
		 		utility.scrollToTop();
		 		
		 		utility.setGoogleMapConfig();

		 		$rootScope.routeSelection = 'activity';
		 		$rootScope.tripdetails = true;
			 	spinner.show();
			 	getDistance();
				getlivecardata();
		 	}

		 	function getDistance() {
				var newdate = new Date();
				newdate.setDate(newdate.getDate() - 1);
				var previousday = moment(new Date(newdate)).format('YYYYMMDD');

				var pdistancefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+$routeParams.devicenumber+'/daily/'+previousday);
				pdistancefbref.once("value", function(snapshot) {
				  	vm.previousdaydistance = snapshot.val() != null ? snapshot.val().distance : 0; 
					getCarDistance();
				}, function (errorObject) {
				  	utility.errorlog("The previous day distance read failed: " , errorObject);
				});
		 	}

		 	function getCarDistance() {
		 		var date = moment(new Date()).format('YYYYMMDD');
		 		distanceref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+$routeParams.devicenumber+'/daily/'+date);
		 		distanceref.on("value", function(snapshot) {
					var data = snapshot.val();
					if(data) {
						vm.distanceCovered = data.distance.toFixed(2);
						
						var distancex =  vm.previousdaydistance / 24;
				  		var time = moment().format("HH.mm");
				  		vm.isUP = vm.distanceCovered >= (distancex * time);

						utility.applyscope($scope);
					}

				}, function (errorObject) {
				  	utility.errorlog("The distance read failed: " , errorObject);
				});
		 	}

		 	function getlivecardata() {
		 		ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+$routeParams.devicenumber);
				ref.on("value", function(snapshot) {
					var data = snapshot.val();
					if(data) {
						vm.cardetail = data;
						vm.status = data.running ? 'Running' : 'Idle';
						if(vm.showmaps == false)
							setGoogleMaps();
						setMarker();
						utility.applyscope($scope);
					}

				}, function (errorObject) {
				  	utility.errorlog("The livecars read failed: " , errorObject);
				});
		 	}

		 	function setMarker() {
		 		var devicedetails = sessionservice.getAccountDevices();
		 		var vehicletype = devicedetails[$routeParams.devicenumber].vehicletype ? devicedetails[$routeParams.devicenumber].vehicletype : 'car';
			 	vm.marker = {
				    id: 1,
				     coords: {
				       latitude: vm.cardetail.latitude,
				       longitude: vm.cardetail.longitude
				    },
			     	options: { 
			     		draggable: false, 
			     		icon: utility.getVehicleImageUrl(vehicletype, !vm.cardetail.running),
		     		  	labelContent: $routeParams.carnumber,
                        labelAnchor: '22 0',
                        labelClass: 'tm-marker-label',
                        labelVisible: true
			     	},
			     	events: {
				        click: function (marker, eventName, args) {
						    var latlng = new google.maps.LatLng(vm.marker.coords.latitude, vm.marker.coords.longitude);
						    var geocoder = new google.maps.Geocoder();
					 		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
					            if (status == google.maps.GeocoderStatus.OK) {
					                if (results[0]) {
					                	var sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('sublocality') >= 0}));
					                	if(sublocality == null)
					                		sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('route') >= 0}));
					          			var content = '<div id="infowindow_content"><span style="font-weight: bold;">'+sublocality.long_name+'</span><br>Last updated '+getTimeStamp(vm.cardetail.locationtime)+'</div>';
					          			var compiled = $compile(content)($scope);
								        infowindow.setContent(compiled[0].innerHTML);
								        infowindow.open(mapinstance , marker);
					          		}
					            }
				            });
				    	}
			     	}
			    };
			}

			vm.gotoActivity = function() {
				$location.path('/activity/'+$routeParams.carnumber);
			}

			function getTimeStamp(unixtimestamp){
				return moment((unixtimestamp)).fromNow();
		 	}

		    function setGoogleMaps(lat, lng, zoom) {
	        	uiGmapGoogleMapApi.then(function(maps) {
	        		vm.showmaps =true;
	        		maps.visualRefresh = true;
		    		vm.map = { center: { latitude: lat ? lat : vm.cardetail.latitude, longitude: lng ? lng : vm.cardetail.longitude }, zoom: zoom ? zoom : 19};
		    		infowindow = new google.maps.InfoWindow({
			  			content: ''
					});
	    		});
	    	}

            uiGmapIsReady.promise(1).then(function(instances) {
			    directionsService = new google.maps.DirectionsService();
			    mapinstance = instances[0].map;
			    vm.mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
    		}, function(error){
				utility.errorlog(error);
				window.location.reload();
			});

			$scope.$on('$destroy', function iVeBeenDismissed() {
                if(ref)
                    ref.off();
                if(distanceref)
                	distanceref.off();
            });
		}
	})();
});