'use strict';

cloudScrum.controller('IterationTrackingController', function IterationTrackingController($scope, $rootScope, $location, $timeout, Google, Flow, Configuration) {

    $scope.iteration = {};
    $scope.activeIteration = 0;
    $scope.currentIteration = 0;
    $scope.storiesStatusesInfo = Configuration.getStoriesStatuses();
    $scope.tasksStatusesInfo = Configuration.getTasksStatuses();
    $scope.users = [];
    $scope.unsaved = false;
    $scope.saving = false;
    $scope.task = {};
    $scope.newTaskModal = $('#new-task-modal');
    $scope.editModal = $('#edit-modal');

    var newTask = function() {
        $scope.task = {
            status: $scope.tasksStatusesInfo[0],
            details: '',
            effort: 0
        };
    };

    var showEditForm = function() {
        $scope.editModal.modal('show');
    };

    newTask();

    Google.login().then(function() {
        Flow.on(function() {
            var releaseId = Flow.getReleaseId();
            if (typeof releaseId === 'undefined') {
                $timeout(function() {
                    $location.path('/backlog');
                }, 100);//instant redirect is causing some unexpected behaviour with sortable widget
            } else {
                $scope.$broadcast('PARENT_READY', {
                    releaseId: releaseId
                });
            }
        });
    });

    $scope.saveRelease = function() {

        $rootScope.loading = true;

        if (!$scope.saving) {

            $scope.saving = true;

            Google.saveRelease(Flow.getReleaseId(), $scope.iterations, Flow.getReleaseName(), false).then(function() {
                $scope.unsaved = false;
                for (var i = 0, l = $scope.iteration.stories.length; i < l; i++) {
                    $scope.iteration.stories[i].save();
                }
            }, function(error) {
                alert('handle error: ' + error); //todo handle error
            }).finally(function() {
                $rootScope.loading = false;
                $scope.saving = false;
            });
        }
    };

    $scope.toggleTasks = function($event) {
        var tmp = $($event.currentTarget);
        tmp.parents('tbody').toggleClass('active');
    };

    $scope.updateEffort = function(story) {

        if (typeof story.effort === 'undefined' || story.effort === null) {
            story.effort = 0;
        }

        var effort = 0;
        for (var i=0; i<story.tasks.length; i++) {
            effort += story.tasks[i]['effort'] ? parseInt(story.tasks[i]['effort']) : 0;
        }

        if (story.effort !== effort) {
            story.effort = effort;
        }
    };

    $scope.setStory = function(story) {
        $scope.activeStory = story;
    };

    $scope.createTask = function() {
        $scope.unsaved = true;
        $scope.task.id = 'T-' + ($scope.activeStory.tasks.length + 1);
        $scope.activeStory.addTask($scope.task, true);
        newTask();
        $scope.newTaskModal.modal('hide');
        //TODO save timeout (10s?) + ng-disabled on save button (when saving)
    };

    $scope.saveEditedItem = function() {
        $scope.editModal.modal('hide');
    };

    $scope.showStoryDetails = function(story) {
        $scope.editItem = story;
        $scope.editItemStory = true;
        $scope.editItemStatuses = $scope.storiesStatusesInfo;
        showEditForm();
    };

    $scope.showTaskDetails = function(task) {
        $scope.editItem = task;
        $scope.editItemStory = false;
        $scope.editItemStatuses = $scope.tasksStatusesInfo;
        showEditForm();
    };

    $scope.edit = function() {
        $scope.unsaved = false;
        for (var i = 0, l = $scope.iteration.stories.length; i < l; i++) {
            $scope.unsaved = $scope.iteration.stories[i].isUnsaved();
            if ($scope.unsaved) {
                break;
            }
        }
        //TODO save timeout (10s?) + ng-disabled on save button (when saving)
    };

    $scope.closeIteration = function() {
        bootbox.confirm('Are you sure you want to close this iteration? All stories which are not accepted will be moved to the next iteration!', function(result) {
            if (result) {
                closeIteration(function() {
                    //growlNotifications.add('Iteration has been closed', 'success', 2000);//TODO notification
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
                    //growlNotifications.add('Release has been closed', 'success', 2000);//TODO notification
                    $location.path('/backlog');
                });
            }
        });
    };

    $scope.updateStoryPoints = function() {
        $scope.$broadcast('UPDATE_STORY_POINTS', {});
    };

    $scope.updateTaskStatus = function(story, isTask) {
        isTask = typeof isTask === 'undefined' ? true : isTask;
        if (isTask) {
            for (var i = 0, l = story.tasks.length; i < l; i++) {
                if (story.tasks[i].status !== $scope.tasksStatusesInfo[$scope.tasksStatusesInfo.length - 1]) {
                    return;
                }
            }
            story.status = Configuration.getUpdateStoryStatusOnAllTaskCompletion();
        }
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
        $scope.unsaved = false;
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
                alert('handle error: ' + error); //todo handle error
            }).finally(function() {
                $rootScope.loading = false;
                $scope.saving = false;
            });
        }, function(error) {
            alert('handle error: ' + error); //todo handle error
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
                        alert('handle error: ' + error); //todo handle error
                    }).finally(function() {
                        $rootScope.loading = false;
                        $scope.saving = false;
                    });
                }, function(error) {
                    alert('handle backlog error: ' + error); //todo handle error
                });
            }, function(error) {
                alert('handle error: ' + error); //todo handle error
            });
        }, function(error) {
            alert('handle error: ' + error); //todo handle error
        });
    }
});