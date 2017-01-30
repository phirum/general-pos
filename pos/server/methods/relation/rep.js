//import {Meteor} from 'meteor/meteor';
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull.js'
import {Customers} from '../../../imports/api/collections/customer.js'
import {EnterBills} from '../../../imports/api/collections/enterBill.js'
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull.js'
import {Invoices} from '../../../imports/api/collections/invoice.js'
import {LendingStocks} from '../../../imports/api/collections/lendingStock.js'
import {Vendors} from '../../../imports/api/collections/vendor.js';
Meteor.methods({
    isRepHasRelation: function (id) {
        let anyRelation = CompanyExchangeRingPulls.findOne({repId: id})
            || Customers.findOne({repId: id})
            || EnterBills.findOne({repId: id})
            || ExchangeRingPulls.findOne({repId: id})
            || Invoices.findOne({repId: id})
            || LendingStocks.findOne({repId: id})
            || Vendors.findOne({repId: id});
        return !!anyRelation;
    }
});

