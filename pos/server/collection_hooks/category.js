import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Categories} from '../../imports/api/collections/category.js';

Categories.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(Categories, 7);
    doc.level = doc.parentId == null ? 0 : Categories.findOne(doc.parentId).level + 1;
});

Categories.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};
    if (modifier.$set.parentId == null) {
        Categories.direct.update(doc._id,
            {$set: {level: 0}, $unset: {_parent: ""}}
        );
    } else {
        var level = Categories.findOne(modifier.$set.parentId).level + 1;
        Categories.direct.update(doc._id,
            {$set: {level: level}}
        );
    }
});

var getCategoryIds = function (array, categories) {
    if (categories != null) {
        categories.forEach(function (c) {
            array.push(c._id);
            var cats = Categories.find({parentId: c._id});
            if (cats != null) {
                return getCategoryIds(array, cats);
            }
        });
    }
    return array;
};


Categories.after.update(function (userId, doc, fieldNames, modifier, options) {
    Meteor.defer(function () {
        Meteor._sleepForMs(500);
        if (doc.level == 0) {
            Categories.direct.update(doc._id, {$unset: {_parent: ''}});
        }
        var categories = Categories.find({parentId: doc._id});
        var array = [];
        array = getCategoryIds(array, categories);
        var childCategories = Categories.find({_id: {$in: array}});
        childCategories.forEach(function (c) {
            var level = Categories.findOne(c.parentId).level + 1;
            Categories.direct.update(c._id,
                {$set: {level: level}}
            );
        });
    });
}, {fetchPrevious: true});
