import {Item} from '../../imports/api/collections/item';

Meteor.methods({
    findItemName(id){
        return Item.findOne(id);
    },
    getItemList(selector){
        selector = selector || {};
        return Item.find(selector, {fields: {_id: 1, name: 1, _unit: 1}}).fetch();
    }
});