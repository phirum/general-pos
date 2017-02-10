import {Item} from '../imports/api/collections/item.js';

Meteor.publish('item', function () {
    // check(listId, String);
    return Item.find();
}, {
    url: "/publications/items"
});