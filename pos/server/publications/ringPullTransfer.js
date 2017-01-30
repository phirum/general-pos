import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';

Meteor.publish('pos.ringPullTransfer', function posRingPullTransfer(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        if(_.isEmpty(selector)){
            return this.ready();
        }
        return RingPullTransfers.find(selector);

    }

    return this.ready();
});
Meteor.publish('pos.activeRingPullTransfers', function activeRingPullTransfers(selector,options={}) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        Meteor._sleepForMs(200);
        let data = RingPullTransfers.find(selector, options);
        return data;
    }
    return this.ready();
});
// Reactive Table
// ReactiveTable.publish("pos.reactiveTable.ringPullTransfer", RingPullTransfers);