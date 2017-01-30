import {Customers} from '../../../imports/api/collections/customer.js';
import {Vendors} from '../../../imports/api/collections/vendor.js'
import {Invoices} from '../../../imports/api/collections/invoice.js'
import {EnterBills} from '../../../imports/api/collections/enterBill.js'
Meteor.methods({
    isPaymentGroupHasRelation: function (id) {
        let anyRelation = Customers.findOne({paymentGroupId: id})
            || EnterBills.findOne({paymentGroupId: id})
            || Vendors.findOne({paymentGroupId: id})
            || Invoices.findOne({paymentGroupId: id});
        return !!anyRelation;
    }
});

