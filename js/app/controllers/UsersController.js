'use strict';

cloudScrum.controller('UsersController', function UsersController($scope, $rootScope, Google, Flow) {

    $scope.users = [];

    Google.login().then(function() {
        Flow.on(function() {
            Google.getPermissionsList(Flow.getCompanyId()).then(function(permissions) {
                $rootScope.loading = false;
                $scope.users = permissions;
            }, function(error) {
                $rootScope.handleError(error);
            });
        });
    });

    $scope.removeUser = function(user) {
        bootbox.confirm('Are you sure?', function(result) {
            if (result) {
                $rootScope.loading = true;

                Google.deletePermission(Flow.getCompanyId(), user.id).then(function() {
                    $scope.users.splice($scope.users.indexOf(user), 1);
                }, function(error) {
                    $rootScope.handleError(error);
                }).finally(function() {
                    $rootScope.loading = false;
                });
            }
        });
    };

    $scope.addUser = function() {

        $rootScope.loading = true;

        Google.newPermission(Flow.getCompanyId(), $scope.email).then(function(permission) {
            $scope.users.push(permission);
            $scope.email = '';
        }, function(error) {
            $rootScope.handleError(error);
        }).finally(function() {
            $rootScope.loading = false;
        });
    };
});