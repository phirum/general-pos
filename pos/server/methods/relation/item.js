import {Meteor} from 'meteor/meteor';
import {Item} from '../../../imports/api/collections/item.js';
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull.js';
import {EnterBills} from '../../../imports/api/collections/enterBill.js';
import {ExchangeGratis} from '../../../imports/api/collections/exchangeGratis.js';
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull.js';
import {Invoices} from '../../../imports/api/collections/invoice.js';
import {LendingStocks} from '../../../imports/api/collections/lendingStock.js';
import {LocationTransfers} from '../../../imports/api/collections/locationTransfer.js';
import {Order} from '../../../imports/api/collections/order.js';
import {PrepaidOrders} from '../../../imports/api/collections/prepaidOrder.js';
import {PurchaseOrder} from '../../../imports/api/collections/purchaseOrder.js';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
import {RingPullTransfers} from '../../../imports/api/collections/ringPullTransfer.js';

Meteor.methods({
    getItem: function (id) {
        return Item.findOne(id)
    },
    isItemHasRelation: function (id) {
        let anyInvoice =
            CompanyExchangeRingPulls.findOne({'items.itemId': id})
            || EnterBills.findOne({'items.itemId': id})
            || ExchangeGratis.findOne({'items.itemId': id})
            || ExchangeRingPulls.findOne({'items.itemId': id})
            || Invoices.findOne({'items.itemId': id})
            || LendingStocks.findOne({'items.itemId': id})
            || LocationTransfers.findOne({'items.itemId': id})
            || Order.findOne({'items.itemId': id})
            || PrepaidOrders.findOne({'items.itemId': id})
            || PurchaseOrder.findOne({'items.itemId': id})
            || ReceiveItems.findOne({'items.itemId': id})
            || RingPullTransfers.findOne({'items.itemId': id});
        return !!anyInvoice;
    }
});
