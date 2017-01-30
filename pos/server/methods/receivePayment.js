import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Invoices} from '../../imports/api/collections/invoice';
import {RemovedPayment} from '../../imports/api/collections/removedCollection';
Meteor.methods({
    insertRemovedPayment(doc){
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        doc.removeDate = new Date();
        RemovedPayment.insert(doc);
    },
    removedReceivePayment({doc}){
        let payments = ReceivePayment.find({invoiceId: doc.invoiceId, status: {$ne: 'removed'}});
        let selector = {$set: {status: 'active'}, $unset: {closedAt: ''}};
        let collections = doc.paymentType == 'term' ? Invoices : GroupInvoice;
        if (payments.count() == 1) {
            collections.direct.update(doc.invoiceId, selector)
        } else {
            console.log('in else');
            ReceivePayment.update({
                invoiceId: doc.invoiceId, status: {$ne: 'removed'},
                _id: {$ne: doc._id},
                $or: [
                    {paymentDate: {$gt: doc.paymentDate}},
                    {dueAmount: {$lt: doc.dueAmount}}
                ]
            }, {
                $inc: {dueAmount: doc.paidAmount, balanceAmount: doc.paidAmount},
                $set: {status: 'partial'}
            }, {multi: true});
            selector.$set.status = 'partial';
            selector.$unset.closedAt = '';
            collections.direct.update(doc.invoiceId, selector);
        }
        ReceivePayment.remove({_id: doc._id});
    }
});