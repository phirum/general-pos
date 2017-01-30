import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';

Meteor.publish('pos.invoice', function simpleInvoice(selector, options) {
    this.unblock();
    
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = Invoices.find(selector, options);
        return data;
    }

    return this.ready();
});
