import {Invoices} from '../../../imports/api/collections/invoice';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {EnterBills} from '../../../imports/api/collections/enterBill';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
import {PayBills} from '../../../imports/api/collections/payBill';
import {GroupBill} from '../../../imports/api/collections/groupBill';

Meteor.publish('pos.invoiceTransactionIn7days', function invoiceTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.invoiceType = 'term';
        selector.invoiceDate = {$gte: startOfWeek, $lte: endOfWeek}
        let data = Invoices.find(selector, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.receivePaymentTransactionIn7days', function receivePaymentTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.paymentDate = {$gte: startOfWeek, $lte: endOfWeek}
        let data = ReceivePayment.find(selector, options);

        return data;
    }
    return this.ready();
});
Meteor.publish('pos.enterBillTransactionIn7days', function enterBillTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.enterBillDate = {$gte: startOfWeek, $lte: endOfWeek}
        let data = EnterBills.find(selector, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.groupInvoiceTransactionIn7days', function groupInvoiceTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.startDate = {$lte: endOfWeek}
        let data = GroupInvoice.find(selector, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.payBillTransactionIn7days', function payBillTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.paymentDate = {$gte: startOfWeek, $lte: endOfWeek};
        let data = PayBills.find(selector, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.groupBillTransactionIn7days', function groupBillTransactionIn7days(selector, options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        selector.startDate = {$gte: startOfWeek, $lte: endOfWeek};
        let data = GroupBill.find(selector, options);
        return data;
    }
    return this.ready();
});