//
import {Meteor} from 'meteor/meteor';
//collections
import {Order} from '../../imports/api/collections/order';


Meteor.publish('pos.activeSaleOrder', function posActiveSaleOrder(selector) {
    if(this.userId) {
         Meteor._sleepForMs(200);
        let saleOrders = Order.find(selector);
        return saleOrders;
    }
    return this.ready();
});