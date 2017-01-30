//import {Meteor} from 'meteor/meteor';
import {Categories} from '../../../imports/api/collections/category.js';
import {Item} from '../../../imports/api/collections/item.js'
Meteor.methods({
    isCategoryHasRelation: function (id) {
        let category = Categories.findOne({parentId: id});
        let item = Item.findOne({categoryId: id});
        return !!(category || item);

    }
});

