import {RemovedPayBill} from '../../imports/api/collections/removedCollection';
import {PayBills} from '../../imports/api/collections/payBill';
import {EnterBills} from '../../imports/api/collections/enterBill';
import {GroupBill} from '../../imports/api/collections/groupBill';
Meteor.methods({
    insertRemovedPayBill(doc){
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        doc.removeDate = new Date();
        RemovedPayBill.insert(doc);
    },
    removedPayBill({doc}){
        let payments = PayBills.find({billId: doc.billId, status: {$ne: 'removed'}});
        let selector = {$set: {status: 'active'}, $unset: {closedAt: ''}};
        let collections = doc.paymentType == 'term' ? EnterBills : GroupBill;
        if (payments.count() == 1) {
            collections.direct.update(doc.billId, selector)
        } else {
            PayBills.update({
                billId: doc.billId, status: {$ne: 'removed'},
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
            collections.direct.update(doc.billId, selector);
        }
        PayBills.remove({_id: doc._id});
    }
});