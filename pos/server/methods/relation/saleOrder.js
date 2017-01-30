import {Meteor} from 'meteor/meteor';
import {Invoices} from '../../../imports/api/collections/invoice.js';
Meteor.methods({
    isSaleOrderHasRelation: function (id) {
        let anyInvoice = Invoices.findOne({saleId: id});
        return !!anyInvoice;
    }
});
