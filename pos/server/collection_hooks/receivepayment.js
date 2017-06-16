import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Invoices} from '../../imports/api/collections/invoice';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
import {Customers} from '../../imports/api/collections/customer.js';

ReceivePayment.before.insert(function (userId, doc) {
    console.log(doc._id);
    doc._id = idGenerator.genWithPrefix(ReceivePayment, `${doc.branchId}-`, 9);
});

ReceivePayment.after.update(function (userId, doc) {
    let preDoc = this.previous;
    let selector = {};
    let type = {
        term: doc.paymentType == 'term',
        group: doc.paymentType == 'group'
    };
    if (doc.balanceAmount > 0) {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'partial'}});
        if (type.term) {
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    } else if (doc.balanceAmount < 0) {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed', paidAmount: doc.dueAmount, balanceAmount: 0}});
        if (type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
    else {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed'}});
        if (type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ReceivePayment";
            let arChartAccount = AccountMapping.findOne({name: 'A/R'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let saleDiscountChartAccount = AccountMapping.findOne({name: 'Sale Discount'});
            let discountAmount = doc.dueAmount * doc.discount / 100;
            data.total = doc.paidAmount + discountAmount;
            transaction.push({
                account: cashChartAccount.account,
                dr: doc.paidAmount,
                cr: 0,
                drcr: doc.paidAmount
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
                cr: doc.paidAmount + discountAmount,
                drcr: -doc.paidAmount + discountAmount
            });
            data.transaction = transaction;

            let customerDoc = Customers.findOne({_id: doc.customerId});
            if (customerDoc) {
                data.name = customerDoc.name;
                data.des = data.des == "" || data.des == null ? ('ទទួលការបង់ប្រាក់ពីអតិថិជនៈ ' + data.name) : data.des;
            }
            data.journalDate = data.paymentDate;

            Meteor.call('updateAccountJournal', data);
        }
        //End Account Integration
    });
});

ReceivePayment.after.remove(function (userId, doc) {
    Meteor.call('insertRemovedPayment', doc);
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ReceivePayment'};
            Meteor.call('removeAccountJournal', data);
        }
        //End Account Integration
    })
});
function updateInvoiceOrInvoiceGroup({_id, selector, collection}) {
    collection.direct.update(_id, selector);
}

Meteor.methods({
    correctAccountReceivePayment(){
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        let i=1;

        let receivePayments=ReceivePayment.find({});
        receivePayments.forEach(function (obj) {
            console.log(i);
            i++;
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
        })

    }
})