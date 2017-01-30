//import {Meteor} from 'meteor/meteor';
import {EnterBills} from '../../../imports/api/collections/enterBill.js'
import {ExchangeGratis} from '../../../imports/api/collections/exchangeGratis.js'
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull.js'
import {Invoices} from '../../../imports/api/collections/invoice.js'
import {LendingStocks} from '../../../imports/api/collections/lendingStock.js'
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js'
import {RingPullTransfers} from '../../../imports/api/collections/ringPullTransfer.js'
import {StockAndAccountMapping} from '../../../imports/api/collections/stockAndAccountMapping.js'
Meteor.methods({
    isStockLocationHasRelation: function (id) {
        let anyRelation = EnterBills.findOne({stockLocationId: id})
            || ExchangeGratis.findOne({stockLocationId: id})
            || ExchangeRingPulls.findOne({stockLocationId: id})
            || Invoices.findOne({stockLocationId: id})
            || LendingStocks.findOne({stockLocationId: id})
            || ReceiveItems.findOne({stockLocationId: id})
            || RingPullTransfers.findOne({stockLocationId: id})
            || StockAndAccountMapping.findOne({stockLocations: id});
        return !!anyRelation;
    }
});

