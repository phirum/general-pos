import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Vendors} from '../../imports/api/collections/vendor.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js';
import {GroupBill} from '../../imports/api/collections/groupBill.js';
import {PayBills} from '../../imports/api/collections/payBill.js';
import {Units} from '../../imports/api/collections/units.js'
// Check user password
export const vendorInfo = new ValidatedMethod({
    name: 'pos.vendorInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let vendor = Vendors.findOne(_id);
            let totalAmountDue = 0;
            let selector = {vendorId: vendor._id, status: {$in: ['active', 'partial']}};
            let bills = (vendor && vendor.termId) ? EnterBills.find(selector) : GroupBill.find({
                vendorOrCustomerId: vendor._id,
                status: {$in: ['active', 'partial']}
            });
            if (bills.count() > 0) {
                bills.forEach(function (bill) {
                    let payBills = PayBills.find({billId: bill._id}, {sort: {_id: 1, paymentDate: 1}});
                    if (payBills.count() > 0) {
                        let lastPayment = _.last(payBills.fetch());
                        totalAmountDue += lastPayment.balanceAmount;
                    } else {
                        totalAmountDue += bill.total;
                    }
                });
            }
            return {vendorInfo: vendor, totalAmountDue};
        }
    }
});
