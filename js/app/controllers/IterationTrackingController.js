'use strict';

cloudScrum.controller('IterationTrackingController', function IterationTrackingController($scope, $rootScope, $location, $timeout, Google, Flow, Configuration, growlNotifications) {

    $scope.hideTaskStatusInEditModal = false;
    $scope.iteration = {};
    $scope.activeIteration = 0;
    $scope.currentIteration = 0;
    $scope.storiesStatusesInfo = Configuration.getStoriesStatuses();
    $scope.tasksStatusesInfo = Configuration.getTasksStatuses();
    $scope.users = [];
    $scope.saving = false;
    $scope.task = {};
    $scope.newTaskModal = $('#new-task-modal');

    var newTask = function() {
        $scope.task = {
            status: $scope.tasksStatusesInfo[0],
            details: '',
            effort: 0
        };
    };

    newTask();

    $scope.setStoryCallback = function(story) {
        $scope.activeStory = story;
    };

    $scope.toggleTasks = function($event) {
        var tmp = $($event.currentTarget);
        tmp.parents('tbody').toggleClass('active');
    };

    $scope.createTask = function() {
        $scope.unsaved = true;
        $scope.task.id = 'T-' + ($scope.activeStory.tasks.length + 1);
        $scope.activeStory.addTask($scope.task, true);
        newTask();
        $scope.newTaskModal.modal('hide');
        //TODO save timeout (10s?) + ng-disabled on save button (when saving)
    };

    $scope.closeIteration = function() {
        bootbox.confirm('Are you sure you want to close this iteration? All stories which are not accepted will be moved to the next iteration!', function(result) {
            if (result) {
                closeIteration(function() {
                    growlNotifications.add('Iteration has been closed', 'success', 2000);
                    $scope.currentIteration++;
                    $scope.activeIteration++;
                    $scope.$broadcast('CLOSE_ITERATION', {iteration: $scope.nextIteration, iterations: $scope.iterations});
                });
            }
        });
    };

    $scope.closeRelease = function() {
        bootbox.confirm('Are you sure you want to close this release? All stories which are not accepted will be moved back to the backlog!', function(result) {
            if (result) {
                closeRelease(function() {
                    growlNotifications.add('Release has been closed', 'success', 2000);
                    $location.path('/backlog');
                });
            }
        });
    };

    $scope.loadIterationCallback = function(iteration, iterations) {
        $scope.iteration = iteration;
        $scope.iterations = iterations;
        $scope.currentIteration = iterations.indexOf(iteration);
        for (var i = 0, l = $scope.iterations.length; i < l; i++) {
            if (!$scope.iterations[i].closed) {
                $scope.activeIteration = i;
                break;
            }
        }
    };

    $scope.loadReleaseCallback = function(iteration, iterations, users) {
        $scope.loadIterationCallback(iteration, iterations);
        $scope.users = users;
    };

    var closeIteration = function(callback) {

        $rootScope.loading = true;

        Google.getReleaseStories(Flow.getReleaseId()).then(function(data) {

            $scope.iterations = data;
            $scope.iteration = $scope.iterations[$scope.currentIteration];
            $scope.nextIteration = $scope.iterations[$scope.currentIteration + 1];

            for (var i = $scope.iteration.stories.length-1; i >= 0 ; i--) {
                var story = $scope.iteration.stories[i];
                if (story.status !== Configuration.getAcceptedStatusIndex()) {
                    $scope.nextIteration.stories.push(story);
                    $scope.iteration.stories.splice(i, 1);
                }
            }

            $scope.iteration.closed = true;

            Google.saveRelease(Flow.getReleaseId(), $scope.iterations, Flow.getReleaseName(), false).then(function() {
                callback();
            }, function(error) {
                $rootScope.handleError(error);
            }).finally(function() {
                $rootScope.loading = false;
                $scope.saving = false;
            });
        }, function(error) {
            $rootScope.handleError(error);
        });
    };

    var closeRelease = function(callback) {

        $rootScope.loading = true;

        Google.getReleaseStories(Flow.getReleaseId()).then(function(data) {

            var addToBacklog = [];

            $scope.iterations = data;
            $scope.iteration = $scope.iterations[$scope.currentIteration];

            for (var i = $scope.iteration.stories.length-1; i >= 0 ; i--) {
                var story = $scope.iteration.stories[i];
                if (story.status !== Configuration.getAcceptedStatusIndex()) {
                    addToBacklog.push(story);
                    $scope.iteration.stories.splice(i, 1);
                }
            }

            $scope.iteration.closed = true;

            Google.saveRelease(Flow.getReleaseId(), $scope.iterations, Flow.getReleaseName(), false).then(function() {

                Google.getBacklogStories(Flow.getBacklogId()).then(function(data) {

                    var stories = data.stories;
                    stories = stories.concat(addToBacklog);

                    Google.saveBacklogStories(stories, Flow.getBacklogId(), Flow.getProjectName()).then(function() {
                        callback();
                    }, function(error) {
                        $rootScope.handleError(error);
                    }).finally(function() {
                        $rootScope.loading = false;
                        $scope.saving = false;
                    });
                }, function(error) {
                    $rootScope.handleError(error);
                });
            }, function(error) {
                $rootScope.handleError(error);
            });
        }, function(error) {
            $rootScope.handleError(error);
        });
    };
});