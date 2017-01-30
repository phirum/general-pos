import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

import {PaymentGroups} from '../../imports/api/collections/paymentGroup.js';

Meteor.publish('pos.paymentGroup', function posPaymentGroup(selector, options) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = PaymentGroups.find(selector, options);

        return data;
    }

    return this.ready();
});
