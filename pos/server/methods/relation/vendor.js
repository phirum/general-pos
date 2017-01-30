//import {Meteor} from 'meteor/meteor';
import {EnterBills} from '../../../imports/api/collections/enterBill.js';
import {PrepaidOrders} from '../../../imports/api/collections/prepaidOrder.js';
import {LendingStocks} from '../../../imports/api/collections/lendingStock.js'
import {ExchangeGratis} from '../../../imports/api/collections/exchangeGratis.js'
import {PayBills} from '../../../imports/api/collections/payBill.js'
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js'
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull.js';
import {PurchaseOrder} from '../../../imports/api/collections/purchaseOrder.js';
Meteor.methods({
    isVendorHasRelation: function (id) {
        let enterBill = EnterBills.findOne({vendorId: id});
        let prepaidOrder = PrepaidOrders.findOne({vendorId: id});
        let lendingStock = LendingStocks.findOne({vendorId: id});
        let exchangeGratis = ExchangeGratis.findOne({vendorId: id});
        let payBills = PayBills.findOne({vendorId: id});
        let receiveItem = ReceiveItems.findOne({vendorId: id});
        let companyExchangeRingPull = CompanyExchangeRingPulls.findOne({vendorId: id});
        let purchaseOrder = PurchaseOrder.findOne({vendorId: id});
        return !!(enterBill || prepaidOrder || purchaseOrder || lendingStock || exchangeGratis || payBills || receiveItem || companyExchangeRingPull);

    }
});

