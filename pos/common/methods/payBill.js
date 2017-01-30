import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
//collection
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {PayBills} from '../../imports/api/collections/payBill.js';
import {Vendors} from '../../imports/api/collections/vendor';
import {GroupBill} from '../../imports/api/collections/groupBill';
// Check user password
export const payBill = new ValidatedMethod({
    name: 'pos.payBill',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        enterBillsObj: {
            type: Object, blackbox: true
        },
        paymentDate: {type: Date},
        branch: {type: String},
        voucherId: {type: String}
    }).validator(),
    run({
        enterBillsObj, paymentDate, branch, voucherId
    }) {
        if (!this.isSimulation) {
            for (let k in enterBillsObj) {
                let selector = {}
                let obj = {
                    billId: k,
                    voucherId: voucherId,
                    paymentDate: paymentDate,
                    paidAmount: enterBillsObj[k].receivedPay,
                    dueAmount: enterBillsObj[k].dueAmount,
                    discount: enterBillsObj[k].discount || 0,
                    balanceAmount: enterBillsObj[k].dueAmount - enterBillsObj[k].receivedPay,
                    vendorId: enterBillsObj[k].vendorId || enterBillsObj[k].vendorOrCustomerId,
                    status: enterBillsObj[k].dueAmount - enterBillsObj[k].receivedPay == 0 ? 'closed' : 'partial',
                    staffId: Meteor.userId(),
                    branchId: branch
                };
                let vendor = Vendors.findOne(obj.vendorId);
                obj.paymentType = vendor.termId ? 'term' : 'group';
                PayBills.insert(obj);
                if(obj.status == 'closed'){
                    selector.$set = {
                        status: 'closed',
                        closedAt: obj.paymentDate
                    }
                }else{
                    selector.$set = {status: 'partial'};
                }
                if(vendor.termId) {
                    EnterBills.direct.update(k, selector)
                }else{
                    GroupBill.direct.update(k, selector);
                }
            }
            return true;
        }
    }
});
