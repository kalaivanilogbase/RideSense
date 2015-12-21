define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('assignuser', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', assignuser]);
        function assignuser($rootScope, $routeParams, $scope, $location, config, spinner, notify, sessionservice, utility, $window ) {
            var vm = this;
            var submitted = false;
            var order;
            vm.selecteduser = null;
            
            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            activate();

            function activate() {
                if($rootScope.selectedOrder != null) {
                    $rootScope.routeSelection = 'orders';
                    order = $rootScope.selectedOrder;
                    vm.users = [];
                    var devices = sessionservice.getAccountDevices();
                    for(prop in devices){
                        vm.users.push({deviceid : prop, vehiclenumber: devices[prop].vehiclenumber});
                    }
                }
                else{
                    $window.history.back();
                }
            }

            function canAdd(){
                return !submitted && vm.selecteduser != null;
            }

            vm.assignUser = function() {
               submitted = true;
               spinner.show();

               var deliverydate = moment(order.date).format('YYYYMMDD');
               var assignorders = {};
               assignorders.Name = order.name;
               assignorders.Address = order.address;
               assignorders.Amount = order.amount;
               assignorders.Mobile = order.mobilenumber;
               assignorders.Time = order.time;
               assignorders.Items = [];
               assignorders.Items.push({Name: order.productname, Description: order.productdesc});
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+vm.selecteduser+"/"+deliverydate+"/"+order.ordernumber);
               ordersref.set(assignorders); 

               var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+deliverydate+"/"+order.ordernumber);
               ordersref1.update({deviceid : vm.selecteduser});

               vm.cancel();
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $window.history.back();
            }
        }
    })();
});