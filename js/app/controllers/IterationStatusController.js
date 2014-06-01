'use strict';

cloudScrum.controller('IterationStatusController', function IterationStatusController($scope, $rootScope, Google, Flow, Configuration) {

    $scope.iteration = {};
    $scope.iterations = [];
    $scope.releases = {};
    $scope.storyPointsEstimated = 0;
    $scope.storyPointsAccepted = 0;
    $scope.percentCompleted = ($scope.storyPointsAccepted/$scope.storyPointsEstimated)*100;

    $scope.release = {
        startDate: '',
        endDate: '',
        totalEstimated: 0,
        totalAccepted: 0,
        closed: true,
        activeIteration: -1
    };

    var oldReleaseSelected = undefined, loading = false;

    if (Google.isAuthorized() && typeof Flow.getReleaseId() !== 'undefined') {
        loading = true;
        preLoadRelease(Flow.getReleaseId());
    }

    $scope.$on('PARENT_READY', function(event, data) {
        if (!loading) {
            preLoadRelease(data.releaseId);
        }
    });

    $scope.$on('UPDATE_STORY_POINTS', function() {
        $scope.updateStoryPoints();
    });

    $scope.$on('CLOSE_ITERATION', function(message, data) {
        $scope.iteration = data.iteration;
        $scope.iterations = data.iterations;
        $scope.updateStoryPoints();
    });

    $scope.changeRelease = function() {
        if ($scope.unsaved) {
            bootbox.confirm('There are some unsaved changes which you will lost! Do you really want to change the release?', function(result) {
                if (!result) {
                    $scope.release = oldReleaseSelected;
                    $rootScope.$apply();
                } else {
                    $scope.setUnsaved(false);
                    loadRelease($scope.release.id);
                }
            });
        } else {
            $scope.setUnsaved(false);
            loadRelease($scope.release.id);
        }
    };

    $scope.updateStoryPoints = function() {

        var estimated = 0, accepted = 0;

        for (var i= 0, l=$scope.iteration.stories.length; i<l ;i++) {

            var tmp = parseInt($scope.iteration.stories[i].estimate);
            estimated += tmp;

            if ($scope.iteration.stories[i].status === $scope.storiesStatusesInfo[$scope.storiesStatusesInfo.length-1]) {
                accepted += tmp;
            }
        }

        $scope.storyPointsEstimated = estimated;
        $scope.storyPointsAccepted = accepted;
        $scope.percentCompleted = ($scope.storyPointsAccepted/$scope.storyPointsEstimated)*100;

        $scope.loadIterationCallback($scope.iteration, $scope.iterations);
    };

    function preLoadRelease(id) {
        loadRelease(id);
        Google.getPermissionsList(Flow.getCompanyId()).then(function(users) {
            $scope.users = users;
        });
    }

    function loadRelease(id) {

        $rootScope.loading = true;

        Flow.setRelease(id);

        Google.getReleaseStories(id).then(function(data) {

            $scope.iterations = data;
            $scope.iteration = _.find($scope.iterations, function(iteration) {return !iteration.closed;});

            if (typeof $scope.iteration === 'undefined') {
                $scope.iteration = $scope.iterations[$scope.iterations.length-1];
            }

            $scope.updateStoryPoints();

            $scope.releases = Flow.getReleases();
            $scope.release = $scope.releases[id];
            oldReleaseSelected = $scope.release;

            $scope.loadReleaseCallback($scope.iteration, $scope.iterations, $scope.users);
            countReleaseStatus();
        }, function(error) {
            $rootScope.handleError(error);
        }).finally(function() {
            $rootScope.loading = false;
        });
    }

    var countReleaseStatus = function() {

        $scope.release.startDate = $scope.iterations[0].startDate;
        $scope.release.endDate = $scope.iterations[$scope.iterations.length - 1].endDate;

        $scope.release.totalEstimated = 0;
        $scope.release.totalAccepted = 0;

        $scope.release.closed = true;
        $scope.release.activeIteration = -1;

        for (var i = 0, l = $scope.iterations.length; i < l; i++) {
            if (!$scope.iterations[i].closed) {
                $scope.release.closed = false;
                if ($scope.release.activeIteration === -1) {
                    $scope.release.activeIteration = i + 1;
                }
            }
            for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                $scope.release.totalEstimated += $scope.iterations[i].stories[j].estimate;
                if ($scope.iterations[i].stories[j].status === Configuration.getAcceptedStatusIndex()) {
                    $scope.release.totalAccepted += $scope.iterations[i].stories[j].estimate;
                }
            }
        }

        $scope.releasepercentageCompleted = ($scope.release.totalAccepted / $scope.release.totalEstimated) * 100;

        if (typeof $scope.loadReleaseInfo !== 'undefined') {
            $scope.loadReleaseInfo($scope.iterations, $scope.release, $scope.users);
        }
    };
});