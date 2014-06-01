'use strict';

cloudScrum.controller('DashboardController', function DashboardController($scope, $rootScope, $timeout, Google, Flow, Configuration, growlNotifications) {

    $scope.releaseData = true;

    $scope.storiesStatusesInfo = Configuration.getStoriesStatuses();
    $scope.tasksStatusesInfo = Configuration.getTasksStatuses();

    Google.login().then(function() {
        Flow.on(function() {
            var releaseId = Flow.getReleaseId();
            if (typeof releaseId === 'undefined') {
                growlNotifications.add('Please create release first', 'warning', 2000);
                $location.path('/backlog');
            } else {
                $timeout(function() {
                    $scope.$apply(function() {
                        $scope.$broadcast('PARENT_READY', {
                            releaseId: releaseId
                        });
                    });
                });
            }
        });
    });

    $scope.loadReleaseCallback = function(iteration, iterations, users) {
        $scope.iteration = iteration;

    };

    $scope.loadIterationCallback = function(iteration, iterations) {
        $scope.iteration = iteration;
    };

    $scope.setUnsaved = function() {};
});