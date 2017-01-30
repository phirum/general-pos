import {Meteor} from 'meteor/meteor';
//collection
import {PayBills} from '../../imports/api/collections/payBill';
import  {GroupBill} from '../../imports/api/collections/groupBill';
Meteor.publish('pos.payBills', function posPayBills(selector) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
    }).validate({selector});

    if (this.userId) {
        let data = PayBills.find(selector);
        return data;

    }
    return this.ready();
});

Meteor.publish('pos.activeGroupBills', function posActiveGroupBills(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        // options: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        let data = GroupBill.find(selector);
        return data;
    }
    return this.ready();
});