'use strict';
//TODO on exit -> if unsaved, alert!
cloudScrum.controller('BacklogController', function BacklogController($scope, $rootScope, $location, $window, $timeout, Google, Flow, Story, growlNotifications) {

    Google.login().then(function() {
        Flow.on(function() {
            var backlogId = Flow.getBacklogId();
            if (typeof backlogId === 'undefined') {
                $timeout(function() {
                    growlNotifications.add('Please select project first', 'warning', 2000);
                    $location.path('/projects');
                }, 100);//instant redirect is causing some unexpected behaviour with sortable widget
            } else {
                Google.getBacklogStories(backlogId).then(function(data) {
                    $scope.stories = data.stories;
                    $scope.nextStoryId = data.maxId+1;
                }, function(error) {
                    $rootScope.handleError(error);
                }).finally(function() {
                    $rootScope.loading = false;
                });
            }
        });
    });

    var newTask = function() {
        $scope.task = {
            details: ''
        };
    };

    var newStory = function() {
        $scope.story = {
            details: '',
            epic: '',
            tasks: []
        };
    };

    newTask();
    newStory();

    $scope.planning = false;
    $scope.unsaved = false;
    $scope.sorted = false;
    $scope.saving = false;
    $scope.sortable = false;
    $scope.stories = [];
    $scope.nextStoryId = 1;
    $scope.iterations = 0;
    $scope.newStoryModal = $('#new-story-modal');
    $scope.newTaskModal = $('#new-task-modal');
    $scope.autoPlanModal = $('#auto-plan-modal');

    $scope.autoPlanningError = '';
    $scope.autoIterations = 5;
    $scope.velocity = 0;

    $scope.iterationLength = 14;
    $scope.releaseStartDate = moment().add('days', 1).format('YYYY-MM-DD');
    $scope.minReleaseStartDate = moment().format('YYYY-MM-DD');
    $scope.maxReleaseStartDate = moment().add('years', 2).format('YYYY-MM-DD');
    $scope.newReleaseModal = $('#new-release-modal');

    //TODO refresh stories (once per 5 minutes?) if not unsaved

    var orderChanged = false, sortedPositions;

    $scope.sortableOptions = {
        stop: function() {
            if (orderChanged) {
                var i = 0, l = $scope.stories.length;
                if (!$scope.planning) {
                    sortedPositions = {};
                    for (; i < l; i++) {
                        sortedPositions[$scope.stories[i].id] = i;
                    }
                } else {
                    var sp = 0, it = 1;
                    for (; i < l; i++) {
                        if (typeof $scope.stories[i].ruler === 'undefined') {
                            sp += $scope.stories[i].estimate;
                        } else {

                            $scope.stories[i].points = sp;
                            $scope.stories[i].iteration = it++;

                            sp = 0;
                        }
                    }
                }
            }
        },
        update: function() {
            orderChanged = true;
            if (!$scope.planning) {
                $scope.unsaved = true;
                $scope.sorted = true;
                //TODO save timeout (10s?) + ng-disabled on save button (when saving)
            }
        },
        axis: 'y',
        cancel: '.disabled'
    };

    $scope.createStory = function() {
        $scope.unsaved = true;
        $scope.story.id = 'S-' + ($scope.nextStoryId++);
        $scope.stories.push(new Story($scope.story, true));
        newStory();
        $scope.newStoryModal.modal('hide');
        //TODO save timeout (10s?) + ng-disabled on save button (when saving)
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

    $scope.saveStories = function() {

        $rootScope.loading = true;

        if (!$scope.saving) {

            $scope.saving = true;

            var newStories = [], changed = {}, idsUpdate = {};

            for (var i = 0, l = $scope.stories.length; i < l; i++) {
                if ($scope.stories[i].isNew) {
                    newStories.push($scope.stories[i]);
                } else if ($scope.stories[i].isUnsaved()) {
                    changed[$scope.stories[i].id] = $scope.stories[i].getChangedFields();
                }
            }

            Google.getBacklogStories(Flow.getBacklogId()).then(function(data) {

                $scope.stories = data.stories;
                $scope.nextStoryId = data.maxId + 1;

                var i, l;

                for (i = 0, l = $scope.stories.length; i < l; i++) {
                    $scope.stories[i].merge(changed[$scope.stories[i].id]);
                }

                for (i = 0, l = newStories.length; i < l; i++) {
                    idsUpdate[newStories[i].id] = 'S-' + ($scope.nextStoryId++);
                    newStories[i].id = idsUpdate[newStories[i].id];
                    $scope.stories.push(newStories[i]);
                }

                if ($scope.sorted) {
                    $scope.stories.sort(function(a, b) {
                        return sortedPositions[idsUpdate[a.id] || a.id] - sortedPositions[idsUpdate[b.id] || b.id];
                    });
                }

                Google.saveBacklogStories($scope.stories, Flow.getBacklogId(), Flow.getProjectName()).then(function() {
                    $scope.unsaved = false;
                    for (var i = 0, l = $scope.stories.length; i < l; i++) {
                        $scope.stories[i].save();
                    }
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

    $scope.planRelease = function() {
        $scope.planning = true;
        $scope.stories.unshift({ruler: true, points: 0, iteration: 1});
        $scope.iterations = 1;
    };

    $scope.autoPlanRelease = function() {

        if ($scope.autoIterations <= 0) {
            $scope.autoPlanningError = 'At least one iteration required';
            return;
        }

        if ($scope.velocity <= 0) {
            $scope.autoPlanningError = 'Velocity it too low';
            return;
        }

        $scope.autoPlanningError = '';

        var i, l, iterationSum, start = 0, iterations = $scope.autoIterations;

        for (i = $scope.stories.length - 1; i >= 0; i--) {
            if (typeof $scope.stories[i].ruler !== 'undefined') {
                $scope.stories.splice(i, 1);
            }
        }

        $scope.iterations = 0;

        while (iterations--) {

            iterationSum = 0;

            for (i = start, l = $scope.stories.length; i < l; i++) {

                if (iterationSum !== 0 && iterationSum + $scope.stories[i].estimate > $scope.velocity) {
                    $scope.stories.splice(i, 0, {ruler: true, points: iterationSum, iteration: ++$scope.iterations});
                    start = i + 1;
                    break;
                }

                iterationSum += $scope.stories[i].estimate;
            }
        }

        if ($scope.autoIterations !== $scope.iterations) {
            $scope.stories.push({ruler: true, points: iterationSum, iteration: ++$scope.iterations});
        }

        $scope.autoPlanModal.modal('hide');
    };

    $scope.cancelPlanning = function() {
        bootbox.confirm('Are you sure?', function(result) {
            if (result) {
                $rootScope.error = '';
                $scope.planning = false;
                $scope.iterations = 0;
                for (var i = $scope.stories.length - 1; i >= 0; i--) {
                    if (typeof $scope.stories[i].ruler !== 'undefined') {
                        $scope.stories.splice(i, 1);
                    }
                }
                $rootScope.$apply();
            }
        });
    };

    $scope.addIteration = function() {
        for (var i = $scope.stories.length-1; i >= 0 ; i--) {
            if (typeof $scope.stories[i].ruler !== 'undefined') {
                var points = typeof $scope.stories[i+1] !== 'undefined' && typeof $scope.stories[i+1].ruler === 'undefined' ? $scope.stories[i+1].estimate : 0;
                $scope.stories.splice(i+2, 0, {ruler: true, points: points, iteration: $scope.stories[i].iteration+1});
                $scope.iterations++;
                break;
            }
        }
    };

    $scope.removeLastIteration = function() {
        for (var i = $scope.stories.length-1; i >= 0 ; i--) {
            if (typeof $scope.stories[i].ruler !== 'undefined') {
                $scope.stories.splice(i, 1);
                $scope.iterations--;
                break;
            }
        }
    };

    $scope.saveRelease = function() {

        $rootScope.error = '';

        for (var i = 0, l = $scope.stories.length; i < l; i++) {
            if (typeof $scope.stories[i].ruler !== 'undefined') {
                if ($scope.stories[i].points === 0) {
                    $rootScope.error = 'Some of your iterations are empty!';
                    break;
                }
            }
        }

        if ($rootScope.error === '') {
            $scope.newReleaseModal.modal('show');
        }
    };

    $scope.createRelease = function() {

        $scope.newReleaseModal.modal('hide');
        $rootScope.loading = true;

        var iterations = [], stories = [], iteration = 1;

        for (var i = 0; i < $scope.stories.length; i++) {
            if (typeof $scope.stories[i].ruler === 'undefined') {
                stories.push($scope.stories[i]);
            } else {
                iterations.push({
                    closed: false,
                    stories: stories.slice(0),
                    startDate: moment($scope.releaseStartDate).add('days', $scope.iterationLength*(iteration-1)).format('YYYY-MM-DD'),
                    endDate: moment($scope.releaseStartDate).add('days', $scope.iterationLength*(iteration++)).format('YYYY-MM-DD')
                });
                stories = [];
            }
        }

        Google.saveRelease(Flow.getProjectId(), iterations, $scope.releaseName, true).then(function(file) {
            Flow.newRelease(file.id, $scope.releaseName, iterations).then(function() {
                Google.saveBacklogStories(stories, Flow.getBacklogId(), Flow.getProjectName()).then(function() {
                    $location.path('/iteration-tracking');
                }, function(error) {
                    $rootScope.handleError(error);
                });
            }, function(error) {
                $rootScope.handleError(error);
                $rootScope.loading = false;
            });
        }, function(error) {
            $rootScope.handleError(error);
            $rootScope.loading = false;
        });
    };

    $scope.edit = function() {
        $scope.unsaved = $scope.sorted;
        if (!$scope.unsaved) {
            for (var i = 0, l = $scope.stories.length; i < l; i++) {
                $scope.unsaved = $scope.stories[i].isUnsaved();
                if ($scope.unsaved) {
                    break;
                }
            }
        }
    };
});