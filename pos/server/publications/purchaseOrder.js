import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {PurchaseOrder} from '../../imports/api/collections/purchaseOrder.js';

Meteor.publish('pos.purchaseOrder', function posPurchaseOrder(selector, options) {
    this.unblock();
    
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = PurchaseOrder.find(selector, options);

        return data;
    }

    return this.ready();
});
