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

    $scope.loadReleaseInfo = function(iterations, release, users) {

        $scope.iterations = iterations;
        $scope.release = release;
        $scope.users = users;

        getBurndownChartData();
    };

    $scope.burndownConfig = {
        options: {
            chart: {
                type: 'line',
                zoomType: 'x'
            }
        },
        series: [{
            name: 'Ideal burndown',
            data: [],
            enableMouseTracking: false
        }, {
            name: 'Actual burndown',
            data: [],
            enableMouseTracking: false,
            dataLabels: {
                enabled: true
            }
        }],
        title: {
            text: 'Burndown chart'
        },
        xAxis: {
            title: {
                text: 'Iteration'
            },
            min: 0,
            minRange: 1,
            allowDecimals: false

        },
        yAxis: {
            title: {
                text: 'Story points'
            },
            min: 0,
            allowDecimals: false
        },
        loading: false
    };

    var getBurndownChartData = function() {

        var ideal = [], actual = [], idealVelocity = $scope.release.totalEstimated / $scope.iterations.length, toBurn = $scope.release.totalEstimated;

        ideal.push($scope.release.totalEstimated);
        actual.push($scope.release.totalEstimated);

        for (var i = 0, l = $scope.iterations.length; i < l; i++) {
            ideal.push($scope.release.totalEstimated - idealVelocity * (i + 1));
            if ($scope.release.closed || i <= $scope.release.activeIteration - 1) {
                for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                    if ($scope.iterations[i].stories[j].status === Configuration.getAcceptedStatusIndex()) {
                        toBurn -= $scope.iterations[i].stories[j].estimate;
                    }
                }
                actual.push(toBurn);
            }
        }

        $scope.burndownConfig.series[0].data = ideal;
        $scope.burndownConfig.series[1].data = actual;
        $scope.burndownConfig.xAxis.max = $scope.iterations.length;
    };

    $scope.setUnsaved = function() {};
    $scope.loadReleaseCallback = function() {};
    $scope.loadIterationCallback = function() {};
});