import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {PayBills} from "../../imports/api/collections/payBill.js";
Meteor.publish('pos.exchangeGratis', function posExchangeGratis(selector, options) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        return ExchangeGratis.find(selector, options);
    }

    return this.ready();
});


Meteor.publish('pos.activeExchangeGratis', function posActiveSaleOrder(selector) {
    if (this.userId) {
        Meteor._sleepForMs(200);
        return ExchangeGratis.find(selector);
    }
    return this.ready();
});
