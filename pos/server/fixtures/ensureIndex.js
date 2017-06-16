import {Meteor} from 'meteor/meteor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Order} from '../../imports/api/collections/order';
import {Invoices} from '../../imports/api/collections/invoice';
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping';
import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping';
import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull';
import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull';
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer';
Meteor.startup(function () {
    GroupInvoice._ensureIndex({startDate: 1, endDate: 1, vendorOrCustomerId: 1});
    Order._ensureIndex({'item.itemId': 1});
    Invoices._ensureIndex({invoiceDate: 1, status: 1});
    Invoices._ensureIndex({voucherId: 1,invoiceDate: 1, customerId: 1, branchId: 1, staffId: 1},{unique: true, sparse: true});
    QuantityRangeMapping._ensureIndex({startQty: 1, endQty: 1});
    StockAndAccountMapping._ensureIndex({userId: 1, branchId: 1}, {unique: 1, sparse: 1});
    CompanyExchangeRingPulls._ensureIndex({companyExchangeRingPullDate: 1});
    ExchangeRingPulls._ensureIndex({exchangeRingPullDate: 1});
    RingPullTransfers._ensureIndex({ringPullTransferDate: 1});

});