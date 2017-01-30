//import {Meteor} from 'meteor/meteor';
import {Customers} from '../../../imports/api/collections/customer.js';
import {Vendors} from '../../../imports/api/collections/vendor.js'
import {Invoices} from '../../../imports/api/collections/invoice.js'
import {EnterBills} from '../../../imports/api/collections/enterBill.js'
Meteor.methods({
    isTermHasRelation: function (id) {
        let anyRelation = Invoices.findOne({termId: id})
            || Customers.findOne({termId: id})
            || Vendors.findOne({termId: id})
            || EnterBills.findOne({termId: id});
        return !!anyRelation;
    }
});

