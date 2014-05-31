'use strict';

cloudScrum.service('Configuration', function Configuration() {

    var self = this;

    self.getStoriesStatuses = function() {
        return ['', 'In progress', 'Blocked', 'Completed', 'Accepted']; //TODO grab from google drive?
    };

    self.getTasksStatuses = function() {
        return ['', 'In progress', 'Testing', 'Blocked', 'Completed']; //TODO grab from google drive?
    };

    self.getAcceptedStatusIndex = function() {
        var storiesStatuses = self.getStoriesStatuses();
        return storiesStatuses[storiesStatuses.length - 1];
    };

    self.getUpdateStoryStatusOnAllTaskCompletion = function() {
        var storiesStatuses = self.getStoriesStatuses();
        return storiesStatuses[storiesStatuses.length - 2];
    };
});