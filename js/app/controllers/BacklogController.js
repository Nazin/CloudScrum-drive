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
                    alert('handle backlog error: ' + error); //todo handle error
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

    $scope.iterationLength = 14;
    $scope.releaseStartDate = moment().add('days', 1).format('YYYY-MM-DD');
    $scope.minReleaseStartDate = moment().format('YYYY-MM-DD');
    $scope.maxReleaseStartDate = moment().add('years', 2).format('YYYY-MM-DD');
    $scope.newReleaseModal = $('#new-release-modal');

    //TODO refresh stories (once per 5 minutes?) if not unsaved

    $scope.sortableOptions = {
        stop: function() {

            var sp = 0, it = 1;

            for (var i = 0; i < $scope.stories.length; i++) {
                if (typeof $scope.stories[i].ruler === 'undefined') {
                    sp += $scope.stories[i].estimate;
                } else {

                    $scope.stories[i].points = sp;
                    $scope.stories[i].iteration = it++;

                    sp = 0;
                }
            }
        },
        update: function() {
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

            Google.saveBacklogStories($scope.stories, Flow.getBacklogId(), Flow.getProjectName()).then(function() {
                $scope.unsaved = false;
                for (var i = 0, l = $scope.stories.length; i < l; i++) {
                    $scope.stories[i].save();
                }
            }, function(error) {
                alert('handle error: ' + error); //todo handle error
            }).finally(function() {
                $rootScope.loading = false;
                $scope.saving = false;
            });
        }
    };

    $scope.planRelease = function() {
        //TODO button for auto planning (available when 1st iteration have some sp)
        $scope.planning = true;
        $scope.stories.unshift({ruler: true, points: 0, iteration: 1});
        $scope.iterations = 1;
    };

    $scope.cancelPlanning = function() {
        if (confirm('Are you sure?')) {//TODO maybe some nicer confirm (not js default)
            $rootScope.error = '';
            $scope.planning = false;
            $scope.iterations = 0;
            for (var i = $scope.stories.length-1; i >= 0 ; i--) {
                if (typeof $scope.stories[i].ruler !== 'undefined') {
                    $scope.stories.splice(i, 1);
                }
            }
        }
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
                //TODO remove stories from backlog
                $location.path('/iteration-tracking');
            }, function() {
                alert('handle error: ' + error); //todo handle error
                $rootScope.loading = false;
            });
        }, function(error) {
            alert('handle error: ' + error); //todo handle error
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