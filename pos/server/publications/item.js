import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Item} from '../../imports/api/collections/item.js';
//
// Meteor.publish('pos.item', function posItem(selector = {}, options = {}) {
//     this.unblock();
//
//     new SimpleSchema({
//         selector: {type: Object, blackbox: true},
//         options: {type: Object, blackbox: true}
//     }).validate({selector, options});
//
//     if (this.userId) {
//         let data = Item.find(selector, options);
//
//         return data;
//     }
//
//     return this.ready();
// });

Meteor.publish('pos.item', function posItem(selector) {
    this.unblock();
    if (this.userId) {
        return Item.find(selector);
    }
    return this.ready();
});