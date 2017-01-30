import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Invoices} from '../../imports/api/collections/invoice';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Customers} from '../../imports/api/collections/customer';

Meteor.methods({
    getCustomerBalance({customerId}){
        let customer = Customers.findOne(customerId);
        let totalAmountDue = 0;
        let selector = {customerId: customerId, status: {$in: ['active', 'partial']}};
        let invoices = (customer && customer.termId) ? Invoices.find(selector) : GroupInvoice.find({
            vendorOrCustomerId: customerId,
            status: {$in: ['active', 'partial']}
        });
        if (invoices.count() > 0) {
            invoices.forEach(function (invoice) {
                let receivePayments = ReceivePayment.find({invoiceId: invoice._id}, {sort: {_id: 1, paymentDate: 1}});
                if (receivePayments.count() > 0) {
                    let lastPayment = _.last(receivePayments.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += invoice.total;
                }
            });
        }
        return totalAmountDue;
    },
    getCustomer({customerId}){
        return Customers.findOne(customerId);
    }
});