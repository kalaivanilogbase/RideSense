define(['angular',
    'config.route',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('activateuser', ['$rootScope', '$routeParams', '$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'loginservice', 'utility', activateuser]);
        function activateuser($rootScope, $routeParams, $scope, $location, config, notify, spinner, sessionservice, loginservice, utility) {
            var submitted = false;
            var vm = this;
            var accountId;
            vm.isuserdeleted = false;
            vm.repeatpwderror = false;
            vm.isPasswordGood = false;

            Object.defineProperty(vm, 'canactivate', {
                get: canactivate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                sessionservice.clear();
                if($routeParams.email != null && $routeParams.email != undefined && $routeParams.accountId != null && $routeParams.accountId != undefined) {
                    vm.email = utility.getDecodeString($routeParams.email);
                    accountId = utility.getDecodeString($routeParams.accountId);
                
                    var ref = new Firebase(config.firebaseUrl+'accounts/'+accountId + '/users/' +$routeParams.email);
                    ref.once("value", function(snapshot) {
                        if(snapshot.val() != null) {
                            vm.userdetail = snapshot.val();
                            vm.isuserdeleted = false;
                        }
                        else {
                            vm.isuserdeleted = true;
                            notify.error("Invitation removed. Please contact administrator");
                        }
                        utility.applyscope($scope);
                    }, function (errorObject) {
                        utility.errorlog("The users read failed: " , errorObject);
                    });
                }
                else {
                    vm.isuserdeleted = true;
                    notify.error("Activation link is broken");
                }
            }

            $rootScope.$on('passwordStrength', function(event, data) {
                vm.isPasswordGood = data.isGood;
            });

            function canactivate() {
                if(vm.isPasswordGood) {
                    if(vm.password != null && vm.password != undefined &&
                       vm.repeatpassword != null && vm.repeatpassword != undefined) {
                        if(vm.password !== vm.repeatpassword)
                            vm.repeatpwderror = true;
                        else
                            vm.repeatpwderror = false;
                        utility.applyscope($scope);
                    }
                }
                return $scope.signupform.$valid && !submitted && !vm.repeatpwderror && !vm.isuserdeleted && vm.isPasswordGood;
            }

            vm.activate = function () {
                submitted = true;
                spinner.show();
                loginservice.signup(vm.email, vm.password).then(signupcompleted, signupfailed)
            }

            function signupcompleted(userData) {
                var usersref = new Firebase(config.firebaseUrl+'users/'+userData.uid+'/');
                var useracc = {};
                useracc.account = accountId;
                useracc.email = vm.email;
                useracc.emailverified = true;
                usersref.set(useracc);

                var userref = new Firebase(config.firebaseUrl+'accounts/'+accountId + '/users/' +$routeParams.email);
                vm.userdetail.joined = true;
                vm.userdetail.joinedon = new Date().getTime();
                vm.userdetail.uid = userData.uid;
                userref.set(vm.userdetail);

                spinner.hide();
                submitted = false;
                notify.success('Activated successfully!');
                $location.path('/login');
            }

            function signupfailed(error) {
                spinner.hide();
                submitted = false;
                if(error.message.indexOf('The specified email address is already in use') >= 0) {
                    notify.error('Account already activated');
                    $location.path('/login');
                }
                else
                    notify.error('Activation failed, please try after some time');
            }
        }
    })();
});