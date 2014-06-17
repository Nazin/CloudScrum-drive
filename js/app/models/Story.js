'use strict';

cloudScrum.factory('Story', ['BaseModel', 'Task', function(BaseModel, Task) {

    function Story(data, isNew) {
        BaseModel.call(this, ['id', 'epic', 'title', 'owner', 'status', 'estimate', 'effort', 'details'], ['tasks'], data, isNew);
    }

    Story.prototype = new BaseModel();

    Story.prototype.addTask = function(task, isNew) {
        this.tasks.push(new Task(task, isNew));
        this.updateField('effort', this.effort + task.hoursEffort);
    };

    Story.prototype.merge = function(changedFields) {
        if (typeof changedFields !== 'undefined') {
            for (var field in changedFields) {
                if (field === 'tasks') {
                    continue;
                }
                this[field] = changedFields[field];
            }
            if (changedFields.tasks.changed.length !== 0) {
                for (var j = 0, lj = this.tasks.length; j < lj; j++) {
                    if (typeof changedFields.tasks.changed[j] !== 'undefined') {
                        for (var taskField in changedFields.tasks.changed[j]) {
                            this.tasks[j][taskField] = changedFields.tasks.changed[j][taskField];
                        }
                    }
                }
            }
            if (changedFields.tasks.new.length !== 0) {
                this.tasks = this.tasks.concat(changedFields.tasks.new);
            }
        }
    };

    return Story;
}]);