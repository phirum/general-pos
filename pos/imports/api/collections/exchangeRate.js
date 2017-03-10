import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const ExchangeRates = new Mongo.Collection("pos_exchangeRates");

ExchangeRates.schema = new SimpleSchema({
    base: {
        type: String
    },
    symbol: {
        type: String,
    },
    rates: {
        type: [Object],
    },
    'rates.$': {
        type: Object,
    },
    'rates.$.currency': {
        type: String,
        label: 'Currency'
    },
    'rates.$.symbol': {
        type: String,
        label: 'Symbol'
    },
    'rates.$.rate': {
        type: Number,
        decimal: true,
        label: 'Rate'
    },
    branchId: {
        type: String
    }
});

Meteor.startup(function () {
    ExchangeRates.schema.i18n("pos.exchangeRate.schema");
    ExchangeRates.attachSchema(ExchangeRates.schema);
});
