'use strict';

cloudScrum.factory('BaseModel', [function() {

    function BaseModel(fields, collections, data, isNew) {

        if (typeof fields === 'undefined') {
            return;
        }

        var me = this,
            _isNew = isNew || false,
            _originalValues = {},
            _values = {},
            _valuesChanged = {};

        for (var i = 0, l = fields.length; i < l; i++) {

            _originalValues[fields[i]] = undefined;
            _values[fields[i]] = undefined;
            _valuesChanged[fields[i]] = false;

            (function(propertyName) {

                Object.defineProperty(me, propertyName, {
                    get: function() {
                        return _values[propertyName];
                    },
                    set: function(newValue) {
                        _values[propertyName] = newValue;
                        _valuesChanged[propertyName] = !_isNew && _values[propertyName] !== _originalValues[propertyName];
                    }
                });

                Object.defineProperty(me, '_' + propertyName, {
                    get: function() {
                        return _valuesChanged[propertyName];
                    }
                });
            })(fields[i]);
        }

        if (data) {

            for (var k = 0, kl = collections.length; k < kl; k++) {
                if (typeof data[collections[k]] !== 'undefined') {
                    this[collections[k]] = data[collections[k]];
                    delete data[collections[k]];
                }
            }

            angular.extend(_originalValues, data);
            angular.extend(_values, data);
        }

        Object.defineProperty(this, 'isNew', {
            get: function() {
                return _isNew;
            }
        });

        this.save = function() {

            for (var i = 0, l = fields.length; i < l; i++) {
                _originalValues[fields[i]] = _values[fields[i]];
                _valuesChanged[fields[i]] = false;
                _isNew = false;
            }

            for (var k = 0, kl = collections.length; k < kl; k++) {
                for (var j = 0, jl = this[collections[k]].length; j < jl; j++) {
                    this[collections[k]][j].save();
                }
            }
        };

        this.isUnsaved = function() {

            var changed = _isNew || _.contains(_valuesChanged, true), collectionChanged;

            if (!changed) {
                for (var k = 0, kl = collections.length; k < kl; k++) {
                    for (var j = 0, jl = this[collections[k]].length; j < jl; j++) {
                        collectionChanged = this[collections[k]][j].isUnsaved();
                        if (collectionChanged) {
                            return true;
                        }
                    }
                }
            }

            return changed;
        };

        this.getChangedFields = function() {

            var changedFields = {};

            for (var i = 0, l = fields.length; i < l; i++) {
                if (_valuesChanged[fields[i]]) {
                    changedFields[fields[i]] = _values[fields[i]];
                }
            }

            for (var k = 0, kl = collections.length; k < kl; k++) {
                changedFields[collections[k]] = {'new': [], 'changed': []};
                for (var j = 0, jl = this[collections[k]].length; j < jl; j++) {
                    if (this[collections[k]][j].isNew) {
                        changedFields[collections[k]].new.push(this[collections[k]][j]);
                    } else if (this[collections[k]][j].isUnsaved()) {
                        changedFields[collections[k]].changed[j] = this[collections[k]][j].getChangedFields();
                    }
                }
            }

            return changedFields;
        };

        this.updateField = function(field, value) {
            _originalValues[field] = _values[field] = value;
            _valuesChanged[field] = false;
        };
    }

    BaseModel.prototype.set = function(data) {
        angular.extend(this, data);
    };

    return BaseModel;
}]);