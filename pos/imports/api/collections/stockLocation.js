import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const StockLocations = new Mongo.Collection("pos_stockLocations");

StockLocations.schema = new SimpleSchema({
    name: {
        type: String
    },
    description: {
        type: String,
        optional:true
    },
    branchId: {
        type: String
    }
});

Meteor.startup(function () {
    StockLocations.schema.i18n("pos.stockLocation.schema");
    StockLocations.attachSchema(StockLocations.schema);
});
