'use strict';

cloudScrum.factory('Story', ['BaseModel', 'Task', function(BaseModel, Task) {

    function Story(data, isNew) {
        BaseModel.call(this, ['id', 'epic', 'title', 'owner', 'status', 'estimate', 'effort', 'details'], ['tasks'], data, isNew);
    }

    Story.prototype = new BaseModel();

    Story.prototype.addTask = function(task, isNew) {
        this.tasks.push(new Task(task, isNew));
    };

    return Story;
}]);