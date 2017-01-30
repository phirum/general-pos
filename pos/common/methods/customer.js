import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Invoices} from '../../imports/api/collections/invoice.js';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice.js';
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer.js';
import {Units} from '../../imports/api/collections/units.js'
// Check user password
export const customerInfo = new ValidatedMethod({
    name: 'pos.customerInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let customer = Customers.findOne(_id);
            let whiteListCustomer = WhiteListCustomer.findOne({customerId: _id});
            let totalAmountDue = 0;
            let selector = {customerId: customer._id, status: {$in: ['active', 'partial']}};
            let invoices = (customer && customer.termId) ? Invoices.find(selector) : GroupInvoice.find({
                vendorOrCustomerId: customer._id,
                status: {$in: ['active', 'partial']}
            });
            if (invoices.count() > 0) {
                invoices.forEach(function (invoice) {
                    let receivePayments = ReceivePayment.find({invoiceId: invoice._id}, {
                        sort: {
                            _id: 1,
                            paymentDate: 1
                        }
                    });
                    if (receivePayments.count() > 0) {
                        let lastPayment = _.last(receivePayments.fetch());
                        totalAmountDue += lastPayment.balanceAmount;
                    } else {
                        totalAmountDue += invoice.total;
                    }
                });
            }

            return {customerInfo: customer, totalAmountDue, whiteListCustomer};
        }
    }
});
