<div class="modal fade" id="edit-modal" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">
    <div class="modal-dialog">
        <div class="modal-content">
            <form role="form" class="form-horizontal" name="editForm" novalidate>
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true" ng-disabled="editForm.$invalid">&times;</button>
                    <h4 class="modal-title">{{editItemStory ? 'Story' : 'Task'}} details</h4>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="editItemTitle" class="col-sm-2 control-label">Title</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" id="editItemTitle" ng-model="editItem.title" ng-value-change="edit()" ng-class="{ changed: editItem._title }" ng-disabled="iteration.closed" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editItemEstimate" class="col-sm-2 control-label">Estimate</label>
                        <div class="col-xs-3">
                            <input type="number" ng-min="1" min="1" class="form-control" id="editItemEstimate" ng-model="editItem.estimate" ng-value-change="edit();" ng-change="updateStoryPoints();" ng-disabled="iteration.closed" ng-class="{ changed: editItem._estimate }" required>
                        </div>
                    </div>
                    <div class="form-group" ng-if="!editItemStory">
                        <label for="editItemEffort" class="col-sm-2 control-label">Effort</label>
                        <div class="col-xs-3">
                            <input type="number" ng-min="0" min="0" class="form-control" id="editItemEffort" ng-model="editItem.effort" ng-value-change="edit();" ng-change="updateEffort(activeStory);" ng-disabled="iteration.closed" ng-class="{ changed: editItem._effort }" required>
                        </div>
                    </div>
                    <div class="form-group" ng-if="editItemStory">
                        <label for="editItemEpic" class="col-sm-2 control-label">Epic</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" id="editItemEpic" ng-model="editItem.epic" ng-value-change="edit()" ng-disabled="iteration.closed" ng-class="{ changed: editItem._epic }">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editItemOwner" class="col-sm-2 control-label">Owner</label>
                        <div class="col-sm-10">
                            <select class="form-control" id="editItemOwner" ng-model="editItem.owner" ng-select-value-change="edit()" ng-class="{ changed: editItem._owner }" ng-disabled="iteration.closed" ng-options="user.emailAddress as user.name for user in users">
                                <option value=""></option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group" ng-if="(!editItemStory && !hideTaskStatusInEditModal) || editItemStory">
                    <label for="editItemStatus" class="col-sm-2 control-label">Status</label>
                        <div class="col-sm-10">
                            <select class="form-control" id="editItemStatus" ng-model="editItem.status" ng-select-value-change="edit();" ng-change="updateTaskStatus(activeStory, !editItemStory);updateStoryPoints();" ng-class="{ changed: editItem._status }" ng-disabled="iteration.closed" ng-options="status for status in editItemStatuses"></select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editItemDetails" class="col-sm-2 control-label">Details</label>
                        <div class="col-sm-10">
                            <textarea class="form-control" rows="3" id="editItemDetails" ng-model="editItem.details" ng-value-change="edit()" ng-disabled="iteration.closed" ng-class="{ changed: editItem._details }"></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" ng-disabled="editForm.$invalid" data-dismiss="modal">Close</button>
                </div>
            </form>
        </div>
    </div>
</div>