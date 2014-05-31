<div ng-controller="IterationUpdateController">
    <div ng-include src="'views/partial/iteration-status.tpl'"></div>

    <p class="clearfix buttons-nav">
        <button type="button" class="btn btn-info pull-right" ng-click="closeIteration()" ng-show="currentIteration === activeIteration && currentIteration !== iterations.length - 1" ng-disabled="unsaved">Close iteration</button>
        <button type="button" class="btn btn-info pull-right" ng-click="closeRelease()" ng-show="!iteration.closed && currentIteration === activeIteration && currentIteration === iterations.length - 1" ng-disabled="unsaved">Close release</button>
        <button type="button" class="btn btn-info pull-right" ng-click="saveRelease()" ng-show="unsaved" ng-disabled="editIterationForm.$invalid">Save</button>
    </p>

    <form role="form" class="form-inline" name="editIterationForm" novalidate>
        <table class="table" id="iteration-tracking">
            <thead>
                <tr>
                    <th></th>
                    <th>Id</th>
                    <th>Epic</th>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Status</th>
                    <th>Estimate</th>
                    <th>Effort</th>
                </tr>
            </thead>
            <tbody ng-repeat="story in iteration.stories">
                <tr>
                    <td><span ng-click="toggleTasks($event)"></span></td>
                    <td>{{story.id}}</td>
                    <td>{{story.epic}}</td>
                    <td ng-bs-popover>
                        <a href="" ng-click="showStoryDetails(story)" class="popover-toggle" data-container="body" data-trigger="hover" data-placement="bottom" data-content="{{story.details ? story.details : ' '}}">{{story.title}}</a>
                    </td>
                    <td>
                        <div class="form-group">
                            <select class="form-control input-sm" ng-model="story.owner" ng-options="user.emailAddress as user.name for user in users" ng-select-value-change="edit()" ng-class="{ changed: story._owner }" ng-disabled="iteration.closed">
                                <option value=""></option>
                            </select>
                        </div>
                    </td>
                    <td>
                        <div class="form-group">
                            <select class="form-control input-sm" ng-model="story.status" ng-options="status for status in storiesStatusesInfo" ng-select-value-change="edit();" ng-change="updateStoryPoints();" ng-class="{ changed: story._status }" ng-disabled="iteration.closed"></select>
                        </div>
                    </td>
                    <td>{{story.estimate}} SP</td>
                    <td>{{story.effort ? story.effort : 0}} h</td>
                </tr>
                <tr class="task" ng-repeat="task in story.tasks" ng-class="{ new: task.isNew }">
                    <td colspan="3"></td>
                    <td ng-bs-popover>
                        <a href="" ng-click="setStory(story);showTaskDetails(task)" class="popover-toggle" data-container="body" data-trigger="hover" data-placement="bottom" data-content="{{task.details ? task.details : ' '}}">{{task.title}}</a>
                    </td>
                    <td>
                        <div class="form-group">
                            <select class="form-control input-sm" ng-model="task.owner" ng-options="user.emailAddress as user.name for user in users" ng-select-value-change="edit()" ng-class="{ changed: task._owner }" ng-disabled="iteration.closed">
                                <option value=""></option>
                            </select>
                        </div>
                    </td>
                    <td>
                        <div class="form-group">
                            <select class="form-control input-sm" ng-model="task.status" ng-options="status for status in tasksStatusesInfo" ng-select-value-change="edit()" ng-change="updateTaskStatus(story)" ng-class="{ changed: task._status }" ng-disabled="iteration.closed"></select>
                        </div>
                    </td>
                    <td>{{task.estimate}} h</td>
                    <td>
                        <div class="form-group">
                            <input type="number" class="form-control input-sm" ng-model="task.effort" ng-min="0" min="0" ng-value-change="edit();" ng-change="updateEffort(story);" ng-class="{ changed: task._effort }" required ng-readonly="iteration.closed" /> h
                        </div>
                    </td>
                </tr>
                <tr class="task" data-story="{{story.id}}">
                    <td class="add-task" colspan="8">
                        <button type="button" class="add btn btn-info btn-xs" data-toggle="modal" data-target="#new-task-modal" ng-click="setStory(story)" ng-disabled="iteration.closed">Add task</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </form>

    <div class="modal fade" id="new-task-modal" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content">
                <form role="form" class="form-horizontal" name="newTaskForm" novalidate>
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h4 class="modal-title">New task</h4>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="taskTitle" class="col-sm-2 control-label">Title</label>
                            <div class="col-sm-10">
                                <input type="text" class="form-control" id="taskTitle" ng-model="task.title" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="taskEstimate" class="col-sm-2 control-label">Estimate</label>
                            <div class="col-xs-3">
                                <input type="number" min="1" class="form-control" id="taskEstimate" ng-model="task.estimate" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="taskOwner" class="col-sm-2 control-label">Owner</label>
                            <div class="col-sm-10">
                                <select class="form-control" id="taskOwner" ng-model="task.owner" ng-options="user.emailAddress as user.name for user in users">
                                    <option value=""></option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="taskStatus" class="col-sm-2 control-label">Status</label>
                            <div class="col-sm-10">
                                <select class="form-control" id="taskStatus" ng-model="task.status" ng-options="status for status in tasksStatusesInfo"></select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="taskDetails" class="col-sm-2 control-label">Details</label>
                            <div class="col-sm-10">
                                <textarea class="form-control" rows="3" id="taskDetails" ng-model="task.details"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary" ng-disabled="newTaskForm.$invalid" ng-click="createTask()">Add</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div ng-include src="'views/partial/edit-modal.tpl'"></div>
</div>