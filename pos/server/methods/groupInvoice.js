import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Invoices} from '../../imports/api/collections/invoice';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {RemoveGroupInvoice} from '../../imports/api/collections/removedCollection';
Meteor.methods({
    removeGroupInvoice({doc}){
        if (doc.status == 'partial' || doc.status == 'closed') {
            ReceivePayment.remove({invoiceId: doc._id});
        }
        GroupInvoice.remove(doc._id);
        Invoices.remove({paymentGroupId: doc._id});
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemoveGroupInvoice.insert(doc);
    }
});
