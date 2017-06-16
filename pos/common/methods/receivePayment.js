import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
//collection
import {Invoices} from '../../imports/api/collections/invoice.js'
import {GroupInvoice} from '../../imports/api/collections/groupInvoice.js'
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
import {Customers} from '../../imports/api/collections/customer';
// Check user password
export const receivePayment = new ValidatedMethod({
    name: 'pos.receivePayment',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        invoicesObj: {
            type: Object, blackbox: true
        },
        paymentDate: {type: Date},
        branch: {type: String},
        voucherId: {type: String}
    }).validator(),
    run({
        invoicesObj, paymentDate, branch, voucherId
    }) {
        if (!this.isSimulation) {
            for (let k in invoicesObj) {
                let selector = {}
                let obj = {
                    invoiceId: k,
                    voucherId: voucherId,
                    paymentDate: paymentDate,
                    paidAmount: invoicesObj[k].receivedPay,
                    penalty: invoicesObj[k].penalty,
                    discount: invoicesObj[k].discount || 0,
                    dueAmount: invoicesObj[k].dueAmount,
                    balanceAmount: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay,
                    customerId: invoicesObj[k].customerId || invoicesObj[k].vendorOrCustomerId,
                    status: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay == 0 ? 'closed' : 'partial',
                    staffId: Meteor.userId(),
                    branchId: branch
                };
                let customer = Customers.findOne(obj.customerId);
                obj.paymentType = customer.termId ? 'term' : 'group';
                ReceivePayment.insert(obj, function (err,res) {
                    if (!err) {
                        //Account Integration
                        obj._id = res;
                        let setting = AccountIntegrationSetting.findOne();
                        if (setting && setting.integrate) {
                            let transaction = [];
                            let data = obj;
                            data.type = "ReceivePayment";
                            let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
                            let saleDiscountChartAccount = AccountMapping.findOne({name: 'Sale Discount'});
                            let discountAmount = obj.dueAmount * obj.discount / 100;
                            data.total = obj.paidAmount + discountAmount;
                            transaction.push({
                                account: cashChartAccount.account,
                                dr: obj.paidAmount,
                                cr: 0,
                                drcr: obj.paidAmount
                            });
                            if (discountAmount > 0) {
                                transaction.push({
                                    account: saleDiscountChartAccount.account,
                                    dr: discountAmount,
                                    cr: 0,
                                    drcr: discountAmount
                                });
                            }
                            transaction.push({
                                account: arChartAccount.account,
                                dr: 0,
                                cr: obj.paidAmount + discountAmount,
                                drcr: -obj.paidAmount + discountAmount
                            });
                            data.transaction = transaction;
                            let customerDoc = Customers.findOne({_id: obj.customerId});
                            if (customerDoc) {
                                data.name = customerDoc.name;
                                data.des = data.des == "" || data.des == null ? ('ទទួលការបង់ប្រាក់ពីអតិថិជនៈ ' + data.name) : data.des;
                            }
                            data.journalDate = data.paymentDate;
                            Meteor.call('insertAccountJournal', data);
                        }
                    }
                });
                if (obj.status == 'closed') {
                    selector.$set = {status: 'closed', closedAt: obj.paymentDate}
                } else {
                    selector.$set = {
                        status: 'partial',
                    };
                }
                if (customer.termId) {
                    Invoices.direct.update(k, selector)
                } else {
                    GroupInvoice.direct.update(k, selector);
                }
            }
            return true;
        }
    }
});
