import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
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
                PayBills.insert(obj, function(err,res) {
                    if(!err) {
                        //Account Integration
                        obj._id = res;
                        let setting = AccountIntegrationSetting.findOne();
                        if (setting && setting.integrate) {
                            let transaction = [];
                            let data = obj;
                            data.type = "PayBill";
                            let apChartAccount = AccountMapping.findOne({name: 'A/P'});
                            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
                            let purchaseDiscountChartAccount = AccountMapping.findOne({name: 'Purchase Discount'});
                            let discountAmount = obj.dueAmount * obj.discount / 100;
                            data.total = obj.paidAmount + discountAmount;

                            let vendorDoc = Vendors.findOne({_id: obj.vendorId});
                            if (vendorDoc) {
                                data.name = vendorDoc.name;
                                data.des = data.des == "" || data.des == null ? ('បង់ប្រាក់ឱ្យក្រុមហ៊ុនៈ ' + data.name) : data.des;
                            }

                            transaction.push({
                                account: apChartAccount.account,
                                dr: obj.paidAmount + discountAmount,
                                cr: 0,
                                drcr: obj.paidAmount + discountAmount
                            }, {
                                account: cashChartAccount.account,
                                dr: 0,
                                cr: obj.paidAmount,
                                drcr: -obj.paidAmount
                            });
                            if (discountAmount > 0) {
                                transaction.push({
                                    account: purchaseDiscountChartAccount.account,
                                    dr: 0,
                                    cr: discountAmount,
                                    drcr: -discountAmount
                                });
                            }
                            /*  let invoice = Invoices.findOne(obj.invoiceId);
                             let firstItem = invoice.items[0];
                             let itemDoc = Item.findOne(firstItem.itemId);
                             invoice.items.forEach(function (item) {
                             let itemDoc = Item.findOne(item.itemId);
                             if (itemDoc.accountMapping.accountReceivable && itemDoc.accountMapping.inventoryAsset) {
                             transaction.push({
                             account: itemDoc.accountMapping.accountReceivable,
                             dr: item.amount,
                             cr: 0,
                             drcr: item.amount
                             }, {
                             account: itemDoc.accountMapping.inventoryAsset,
                             dr: 0,
                             cr: item.amount,
                             drcr: -item.amount
                             })
                             }
                             });*/
                            data.transaction = transaction;
                            data.journalDate = data.paymentDate;
                            Meteor.call('insertAccountJournal', data);
                            console.log(data);
                        }
                        //End Account Integration
                    }
                });
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
