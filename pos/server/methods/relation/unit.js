//import {Meteor} from 'meteor/meteor';
import {Item} from '../../../imports/api/collections/item.js'
Meteor.methods({
    isUnitHasRelation: function (id) {
        let item = Item.findOne({unitId: id});
        return !!item;
    }
});

