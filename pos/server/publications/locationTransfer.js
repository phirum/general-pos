import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';

Meteor.publish('pos.locationTransfer', function posLocationTransfer(selector, options) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = LocationTransfers.find(selector, options);
        return data;
    }

    return this.ready();
});
Meteor.publish('pos.activeLocationTransfers', function activeLocationTransfers(selector,options={}) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        Meteor._sleepForMs(200);
        let data = LocationTransfers.find(selector, options);
        return data;
    }
    return this.ready();
});