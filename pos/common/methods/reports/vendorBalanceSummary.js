import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Vendors} from '../../../imports/api/collections/vendor.js';
import {EnterBills} from '../../../imports/api/collections/enterBill.js';
import {GroupBill} from '../../../imports/api/collections/groupBill.js';
import {PayBills} from '../../../imports/api/collections/payBill.js';
import {Branch} from '../../../../core/imports/api/collections/branch';

export const VendorBalanceSummary = new ValidatedMethod({
    name: 'pos.vendorBalanceSummary',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            let data = {
                title: {vendor: 'All'},
                header: {},
                content: [{index: 'No Result'}],
                footer: {totalBalance: 0}
            };
            let branchId;
            let vendorSelector = {};
            if (params.branchId) {
                branchId = params.branchId;
                let branch = Branch.findOne({_id: branchId});
                data.title.branch = branch;
            } else {
                return data;
            }
            if (params.vendorId) {
                vendorSelector._id = params.vendorId;
                let vendor = Vendors.findOne({_id: params.vendorId});
                data.title.vendor = vendor && vendor.name;
            }
            let vendors = Vendors.find(vendorSelector, {sort: {name: 1}}).fetch();
            let grandTotalDue = 0;
            console.log(branchId);
            vendors.forEach(function (vendor) {
                let totalAmountDue = 0;
                let selector = {branchId: branchId, vendorId: vendor._id, status: {$in: ['active', 'partial']}};
                let bills = (vendor && vendor.termId) ? EnterBills.find(selector) : GroupBill.find({
                    vendorOrCustomerId: vendor._id,
                    branchId: branchId,
                    status: {$in: ['active', 'partial']}
                });
                if (bills.count() > 0) {
                    bills.forEach(function (bill) {
                        let payBills = PayBills.find({branchId: branchId, billId: bill._id}, {
                            sort: {
                                _id: 1,
                                paymentDate: 1
                            }
                        });
                        if (payBills.count() > 0) {
                            let lastPayment = _.last(payBills.fetch());
                            totalAmountDue += lastPayment.balanceAmount;
                        } else {
                            totalAmountDue += bill.total;
                        }
                    });
                }
                vendor.balance = totalAmountDue;
                grandTotalDue += totalAmountDue;
            });

            if (vendors.length > 0) {
                data.content = vendors;
                data.footer.totalBalance = grandTotalDue;
            }
            return data;
        }
    }
});
