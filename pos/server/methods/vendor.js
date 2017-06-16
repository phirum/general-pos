import {Vendors} from '../../imports/api/collections/vendor';
import {EnterBills} from '../../imports/api/collections/enterBill';
import {GroupBill} from '../../imports/api/collections/groupBill';
import {PayBills} from '../../imports/api/collections/payBill';
Meteor.methods({
    getVendor({vendorId}){
        return Vendors.findOne(vendorId);
    },
    getVendorBalance({vendorId, branchId}){
        let vendor = Vendors.findOne(vendorId);
        let totalAmountDue = 0;
        let selector = {branchId: branchId,vendorId: vendorId, status: {$in: ['active', 'partial']}};
        let bills = (vendor && vendor.termId) ? EnterBills.find(selector) : GroupBill.find({
            vendorOrCustomerId: vendorId,
            status: {$in: ['active', 'partial']},
            branchId: branchId
        });
        if (bills.count() > 0) {
            bills.forEach(function (bill) {
                let payBills = PayBills.find({branchId: branchId,billId: bill._id}, {sort: {_id: 1, paymentDate: 1}});
                if (payBills.count() > 0) {
                    let lastPayment = _.last(payBills.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += bill.total;
                }
            });
        }
        return totalAmountDue;
    }
});