define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('order', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', order]);
        function order($rootScope, $routeParams, $scope, $location, config, spinner, notify, sessionservice, utility, $window) {
            var vm = this;
            var submitted = false;
            
            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                $rootScope.routeSelection = 'orders';
                vm.isOrderEdit = false;
                
                isDateFiledSupported();

                if(utility.getOrderSelected() != null) {
                    vm.order = utility.getOrderSelected();
                    var timesplit = vm.order.time.split('-');
                    vm.time1 = timesplit[0];
                    vm.time2 = timesplit[1];

                    vm.isOrderEdit = true;
                    vm.selecteddate = vm.isdatesupport ? new Date(vm.order.date): moment(utility.getDateFromString(vm.order.date)).format('DD/MM/YYYY');
                }
                else {
                    vm.time1 = "10:00 AM"
                    vm.time2 = "12:00 PM"
                    setTodayDate();
                }
            }

            function canAdd(){
                return $scope.orderform.$valid && !submitted ;
            }

            function setTodayDate() {
                vm.selecteddate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
            }

            function isDateFiledSupported(){
                var datefield=document.createElement("input")
                datefield.setAttribute("type", "date")
                if (datefield.type != "date") { //if browser doesn't support input type="date"
                   vm.isdatesupport = false;
                }
                else
                   vm.isdatesupport = true;
            }

            $rootScope.$on('datepicker:dateselected', function (event, data) {
                if(data.date.format('DD/MM/YYYY') != vm.selecteddate) {
                    vm.selecteddate = data.date.format('DD/MM/YYYY');
                    vm.datechanged(vm.selecteddate);
                }
            });

            vm.datechanged = function (date) {
                if(date == null) {
                    setTodayDate();
                    date = vm.selecteddate;
                }
                else 
                    vm.selecteddate = date;
            }

            vm.addorder = function() {
                submitted = true;
                spinner.show();
                
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                vm.order.time = vm.time1 + "-" + vm.time2;
                checkOrderNumber();
            }

            function checkOrderNumber() {
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
               ordersref.once("value", function(snapshot) {
                    if(snapshot.val() == null) {
                        var geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ 'address': vm.order.address }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                vm.order.lat = results[0].geometry.location.lat();
                                vm.order.lng = results[0].geometry.location.lng();
                            }
                            ordersref.set(vm.order);
                            vm.cancel();
                            utility.applyscope($scope);
                        });
                    }
                    else{
                        notify.error("Order number already exists");
                    }
                });
            }

            vm.updateorder = function() {
                submitted = true;
                spinner.show();

                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': vm.order.address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        vm.order.lat = results[0].geometry.location.lat();
                        vm.order.lng = results[0].geometry.location.lng();
                    }
                    
                    vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref.update({name: vm.order.name, mobilenumber: vm.order.mobilenumber, amount: vm.order.amount, time: vm.time1 + " - " + vm.time2, address: vm.order.address,
                    productname : vm.order.productname, productdesc: vm.order.productdesc, lat: vm.order.lat, lng: vm.order.lng});

                    if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                        var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                        ordersref1.update({Name: vm.order.name, Mobile: vm.order.mobilenumber, Amount: vm.order.amount, Time: vm.time1 + " - " + vm.time2, Address: vm.order.address});

                        ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber+"/Items/0");
                        ordersref1.update({Name: vm.order.productname, Description: vm.order.productdesc});
                    }

                    vm.cancel();
                    utility.applyscope($scope);
                });
            }

            vm.deleteorder = function() {
                vm.isdelete = true;
            }

            vm.deletecancel = function() {
                vm.isdelete = false;
            }

            vm.deleteconfirm = function() {
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                submitted = true;
                spinner.show();

                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
                ordersref.remove();

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref.remove();
                }

                notify.success('Order deleted successfully');
                vm.cancel();
            }

            vm.viewtrip = function() {
                $location.path('/order/trip');
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/orders');
            }
        }
    })();
});