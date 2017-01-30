import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';
import {PayBills} from "../../imports/api/collections/payBill.js";
Meteor.publish('pos.prepaidOrder', function posPrepaidOrder(selector, options) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let prepaidOrders = PrepaidOrders.find(selector, options);
        return prepaidOrders;
    }

    return this.ready();
});


Meteor.publish('pos.activePrepaidOrder', function posActiveSaleOrder(selector) {
    if (this.userId) {
        Meteor._sleepForMs(200);
        let prepaidOrders = PrepaidOrders.find(selector);
        return prepaidOrders;
    }
    return this.ready();
});
