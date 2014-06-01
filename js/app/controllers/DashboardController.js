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

        $scope.usersMapping = {};
        for (var i = 0, l = $scope.users.length; i < l; i++) {
            $scope.usersMapping[$scope.users[i].emailAddress] = $scope.users[i].name;
        }

        getBurndownChartData();
        getTasksEffortEstimateChartData();
        getUsersEffortChartData();
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

    $scope.tasksEffortEstimateChartConfig = {
        options: {
            chart: {
                type: 'column'
            }
        },
        title: {
            text: 'Tasks: estimations vs. effort'
        },
        xAxis: {
            title: {
                text: 'Iteration'
            },
            min: 1,
            categories: []
        },
        yAxis: {
            title: {
                text: 'Hours'
            },
            min: 0
        },
        series: [{
            name: 'Tasks estimations',
            data: []
        }, {
            name: 'Tasks effort',
            data: []
        }],
        loading: false
    };

    $scope.usersEffortChartConfig = {
        options: {
            chart: {
                type: 'column'
            }
        },
        title: {
            text: 'Users effort'
        },
        xAxis: {
            title: {
                text: 'Iteration'
            },
            min: 1,
            categories: []
        },
        yAxis: {
            title: {
                text: 'Hours'
            },
            min: 0
        },
        series: [],
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

    var getTasksEffortEstimateChartData = function() {

        var tasksEstimation = [0], tasksEffort = [0], iterationTasksEstimation = 0, iterationTasksEffort = 0;

        for (var i = 0, l = $scope.iterations.length; i < l; i++) {
            iterationTasksEstimation = 0;
            iterationTasksEffort = 0;
            if ($scope.release.closed || i <= $scope.release.activeIteration - 1) {
                for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                    for (var k = 0, lk = $scope.iterations[i].stories[j].tasks.length; k < lk; k++) {
                        iterationTasksEstimation += $scope.iterations[i].stories[j].tasks[k].estimate;
                        iterationTasksEffort += $scope.iterations[i].stories[j].tasks[k].effort;
                    }
                }
            }
            tasksEstimation.push(iterationTasksEstimation);
            tasksEffort.push(iterationTasksEffort);
        }

        $scope.tasksEffortEstimateChartConfig.series[0].data = tasksEstimation;
        $scope.tasksEffortEstimateChartConfig.series[1].data = tasksEffort;
    };

    var getUsersEffortChartData = function() {

        var series = [], usersData = {}, mail;

        for (var i = 0, l = $scope.iterations.length; i < l; i++) {

            if ($scope.release.closed || i <= $scope.release.activeIteration - 1) {
                for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                    for (var k = 0, lk = $scope.iterations[i].stories[j].tasks.length; k < lk; k++) {
                        var task = $scope.iterations[i].stories[j].tasks[k];
                        if (task.effort !== 0 && task.owner && task.owner !== '') {
                            initUserData(usersData, task.owner);
                            usersData[task.owner][i + 1] += task.effort;
                        }
                    }
                }
            }
        }

        for (mail in usersData) {
            series.push({
                name: $scope.usersMapping[mail] || mail,
                data: usersData[mail]
            });
        }

        $scope.usersEffortChartConfig.series = series;
    };

    var initUserData = function(usersData, mail) {
        if (typeof usersData[mail] === 'undefined') {
            var size = $scope.iterations.length;
            usersData[mail] = [];
            while(size--) usersData[mail].push(0);
        }
    };

    $scope.setUnsaved = function() {};
    $scope.loadReleaseCallback = function() {};
    $scope.loadIterationCallback = function() {};
});