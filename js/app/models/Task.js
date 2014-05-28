'use strict';

cloudScrum.factory('Task', ['BaseModel', function(BaseModel) {

    function Task(data, isNew) {
        BaseModel.call(this, ['id', 'title', 'owner', 'status', 'estimate', 'effort', 'details'], [], data, isNew);
    }

    Task.prototype = new BaseModel();

    return Task;
}]);