import {GroupBill} from '../../imports/api/collections/groupBill';
import {EnterBills} from '../../imports/api/collections/enterBill';
import {PayBills} from '../../imports/api/collections/payBill';
import {RemoveGroupBill} from '../../imports/api/collections/removedCollection';
Meteor.methods({
    removeGroupBill({doc}){
        if (doc.status == 'partial' || doc.status == 'closed') {
            PayBills.remove({billId: doc._id});
        }
        GroupBill.remove(doc._id);
        EnterBills.remove({paymentGroupId: doc._id});
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveGroupBill.insert(doc);
    }
});
