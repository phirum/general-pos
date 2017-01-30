import {Item} from '../../imports/api/collections/item';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Penalty} from '../../imports/api/collections/penalty';
import {RemovedInvoice} from '../../imports/api/collections/removedCollection';
Meteor.methods({
    insertRemovedInvoice(doc){
        if (doc.invoiceType == 'term' && (doc.status == 'partial' || doc.status == 'closed')) {
            ReceivePayment.remove({invoiceId: doc._id});
        }
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemovedInvoice.insert(doc);
    },
    calculateLateInvoice({invoices}){
        let count = 0;
        let penalty = Penalty.findOne({}, {sort: {_id: -1}}) || {rate: 0, notExist: true};
        let lateInvoices = [];
        let currentDate = moment();
        let calculatePenalty = {};
        invoices.forEach(function (invoice) {
            let invoiceDate = moment(invoice.dueDate);
            let numberOfDayLate = currentDate.diff(invoiceDate, 'days');
            if (numberOfDayLate > 0) {
                count += 1;
                if (invoice.status == 'partial') {
                    let lastReceivePayment = ReceivePayment.findOne({invoiceId: invoice._id}, {sort: {_id: -1}});
                    calculatePenalty[invoice._id] = (lastReceivePayment.balanceAmount * (penalty.rate / 100) * numberOfDayLate);
                } else {
                    calculatePenalty[invoice._id] =  (invoice.total * (penalty.rate / 100) * numberOfDayLate);
                }
                lateInvoices.push(invoice._id);
            }
        });
        return {count, lateInvoices, calculatePenalty, penaltyNotExist: penalty.notExist || false};
    },
    invoiceShowItems({doc}){
        doc.staff = Meteor.users.findOne(doc.staffId).username || '';
        doc.items.forEach(function (item) {
            item.name = Item.findOne(item.itemId).name;
        });
        return doc;
    }
});