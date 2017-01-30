import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {ReceiveItems} from '../../imports/api/collections/receiveItem.js';

Meteor.publish('pos.receiveItem', function posReceiveItem(selector, options) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = ReceiveItems.find(selector, options);
        return data;
    }

    return this.ready();
});
Meteor.publish('pos.activeReceiveItems', function activeReceiveItems(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        Meteor._sleepForMs(200);
        let data = ReceiveItems.find(selector);
        return data;
    }
    return this.ready();
});