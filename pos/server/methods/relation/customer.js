//import {Meteor} from 'meteor/meteor';
import {Order} from '../../../imports/api/collections/order.js';
import {Invoices} from '../../../imports/api/collections/invoice.js';
//import {ReceivePayment} from '../../../imports/api/collections/receivePayment.js'
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull'
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice'
Meteor.methods({
    isCustomerHasRelation: function (id) {
        let anyInvoice = Order.findOne({customerId: id}) || Invoices.findOne({customerId: id}) || GroupInvoice.findOne({customerId: id}) || ExchangeRingPulls.findOne({customerId: id});
        return !!anyInvoice;
    }
});

