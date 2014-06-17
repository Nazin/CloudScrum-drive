'use strict';

cloudScrum.controller('IterationUpdateController', function IterationUpdateController($scope, $rootScope, $location, $timeout, Google, Flow, Configuration, growlNotifications) {

    $scope.$on('EDIT', function() {
        $scope.edit();
    });

    Google.login().then(function() {
        Flow.on(function() {
            var releaseId = Flow.getReleaseId();
            if (typeof releaseId === 'undefined') {
                $timeout(function() {
                    growlNotifications.add('Please create release first', 'warning', 2000);
                    $location.path('/backlog');
                }, 100);//instant redirect is causing some unexpected behaviour with sortable widget
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

    $scope.setUnsaved = function(unsaved) {
        $scope.unsaved = unsaved;
    };

    $scope.saveRelease = function() {

        $rootScope.loading = true;

        if (!$scope.saving) {

            $scope.saving = true;

            var changed = [];

            for (var i = 0, l = $scope.iterations.length; i < l; i++) {
                if (!$scope.iterations[i].closed) {
                    changed[i] = {};
                    for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                        if ($scope.iterations[i].stories[j].isUnsaved()) {
                            changed[i][$scope.iterations[i].stories[j].id] = $scope.iterations[i].stories[j].getChangedFields();
                        }
                    }
                }
            }

            Google.getReleaseStories(Flow.getReleaseId()).then(function(data) {

                $scope.iterations = data;

                for (var i = 0, l = $scope.iterations.length; i < l; i++) {
                    if (typeof changed[i] !== 'undefined') {
                        for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                            $scope.iterations[i].stories[j].merge(changed[i][$scope.iterations[i].stories[j].id]);
                        }
                    }
                }

                Google.saveRelease(Flow.getReleaseId(), $scope.iterations, Flow.getReleaseName(), false).then(function() {
                    $scope.unsaved = false;
                    for (var i = 0, l = $scope.iterations.length; i < l; i++) {
                        for (var j = 0, lj = $scope.iterations[i].stories.length; j < lj; j++) {
                            $scope.iterations[i].stories[j].save();
                        }
                    }
                    $scope.$broadcast('UPDATE_RELEASE_DATA', $scope.iterations);
                }, function(error) {
                    $rootScope.handleError(error);
                }).finally(function() {
                    $rootScope.loading = false;
                    $scope.saving = false;
                });
            }, function(error) {
                $rootScope.handleError(error);
            });
        }
    };

    $scope.showStoryDetails = function(story) {
        $scope.setStory(story);
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

    $scope.setStory = function(story) {
        $scope.activeStory = story;
        if (typeof $scope.setStoryCallback !== 'undefined') {
            $scope.setStoryCallback(story);
        }
    };

    $scope.edit = function() {
        $scope.unsaved = false;
        for (var j = 0, lj = $scope.iterations.length; j < lj; j++) {
            if ($scope.iterations[j].closed) {
                continue;
            }
            for (var i = 0, l = $scope.iterations[j].stories.length; i < l; i++) {
                $scope.unsaved = $scope.iterations[j].stories[i].isUnsaved();
                if ($scope.unsaved) {
                    return;
                }
            }
        }
        //TODO save timeout (10s?) + ng-disabled on save button (when saving)
    };

    $scope.updateEffort = function(story) {

        if (typeof story.effort === 'undefined' || story.effort === null) {
            story.effort = 0;
        }

        var effort = 0;
        for (var i=0; i<story.tasks.length; i++) {
            effort += story.tasks[i]['hoursEffort'] ? parseFloat(story.tasks[i]['hoursEffort']) : 0;
        }

        if (story.effort !== effort) {
            story.updateField('effort', parseFloat(effort.toFixed(1)));
        }
    };

    $scope.updateTaskEffort = function(task, value, oldValue) {
        task.effort += (value - oldValue) * 3600;
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

    var showEditForm = function() {
        $scope.editModal = $scope.editModal || $('#edit-modal');
        $scope.editModal.modal('show');
    };
});
