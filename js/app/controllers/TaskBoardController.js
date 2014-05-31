'use strict';

cloudScrum.controller('TaskBoardController', function TaskBoardController($scope, $rootScope, $location, $timeout, Google, Flow, Configuration) {

    $scope.tasksStatuses = Configuration.getTasksStatuses();
    $scope.storiesStatusesInfo = Configuration.getStoriesStatuses();
    $scope.iteration = {};
    $scope.users = [];

    $scope.unsaved = false;

    var statusesInverted = _.invert($scope.tasksStatuses);

    Google.login().then(function() {
        Flow.on(function() {
            var releaseId = Flow.getReleaseId();
            if (typeof releaseId === 'undefined') {
                $timeout(function() {
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

    $scope.sortableOptions = {
        connectWith: '.stories',
        items: '.story'
    };

    $scope.loadIterationCallback = function(iteration, iterations) {
        $scope.iteration = iteration;
        $scope.iterations = iterations;
        transferStoriesToTaskBoard();
    };

    $scope.loadReleaseCallback = function(iteration, iterations, users) {
        $scope.users = users;
        $scope.usersMapping = {};
        for (var i = 0, l = $scope.users.length; i < l; i++) {
            $scope.usersMapping[$scope.users[i].emailAddress] = $scope.users[i].name;
        }
        $scope.loadIterationCallback(iteration, iterations);
    };

    $scope.edit = function() {
        $scope.unsaved = false;
        for (var i = 0, l = $scope.iteration.stories.length; i < l; i++) {
            $scope.unsaved = $scope.iteration.stories[i].isUnsaved();
            if ($scope.unsaved) {
                break;
            }
        }
    };

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

    var transferStoriesToTaskBoard = function() {
        var stories = $scope.iteration.stories;
        for (var i = 0, l = stories.length; i < l; i++) {
            var story = stories[i];
            story.tasksByStatus = [];
            for (var k = 0, lk = $scope.tasksStatuses.length; k < lk; k++) {
                story.tasksByStatus.push([]);
            }
            for (var j = 0, lj = story.tasks.length; j < lj; j++) {
                story.tasks[j].id = j;
                story.tasksByStatus[statusesInverted[story.tasks[j].status]].push(story.tasks[j]);
            }
            updateSortableOptions(story);
        }
    };

    var orderChanged = false, changedToStatus = 0;

    var updateSortableOptions = function(story) {
        $scope.sortableOptions[story.id] = {
            start: function() {
                orderChanged = false;
            },
            stop: function(event, ui) {
                if (orderChanged) {

                    var id = ui.item.data('story'), tid = ui.item.data('task'), task = $('.task[data-story=' + id + '][data-task=' + tid + ']'),
                        storyObj = $scope.iteration.stories[ui.item.data('story-index')],
                        taskObj = storyObj.tasks[tid];

                    taskObj.status = $scope.tasksStatuses[changedToStatus];

                    if (typeof taskObj.owner === 'undefined' || taskObj.owner === '' || taskObj.owner === null) {
                        taskObj.owner = Google.getUserEmail();
                    }

                    $scope.edit();

                    for (var i = 0, l = story.tasks.length; i < l; i++) {
                        if (story.tasks[i].status !== $scope.tasksStatuses[$scope.tasksStatuses.length - 1]) {
                            return;
                        }
                    }
                    story.status = Configuration.getUpdateStoryStatusOnAllTaskCompletion();
                }
            },
            update: function(event) {
                orderChanged = true;
                changedToStatus = parseInt($(event.target).data('status'));
            },
            connectWith: '.tasks_' + story.id,
            items: '.task',
            cancel: '.disabled'
        };
    };

    $scope.sortableOptions = [];
});