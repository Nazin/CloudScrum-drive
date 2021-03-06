'use strict';

cloudScrum.controller('AuthController', function AuthController($scope, $rootScope, $location, Google, Flow) {

    Google.login().finally(function() {
        $rootScope.loading = false;
    });

    $scope.authorize = function() {

        Google.handleAuthClick().then(function() {

            $rootScope.authorized = true;
            $rootScope.forceNewLogin = true;
            $rootScope.loading = true;

            Google.findCompaniesFiles().then(function(files) {

                if (files.length === 0) {
                    $rootScope.newCompanyModal.modal('show');
                } else {

                    for (var i=0; i<files.length; i++) {
                        $rootScope.companies.push({id: files[i].id, name: files[i].title.replace('CloudScrum-', '')});
                    }

                    Flow.setCompany(files[0].id, files[0].title.replace('CloudScrum-', ''));
                    $location.path('/projects');
                }
            }, function(error) {
                $rootScope.handleError(error);
            }).finally(function() {
                $rootScope.loading = false;
            });
        });
    };
});