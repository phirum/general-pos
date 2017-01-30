import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

export const LendingInventories = new Mongo.Collection("pos_lendingInventories");


// LendingInventories schema
LendingInventories.schema = new SimpleSchema({
    itemId: {
        type: String
    },
    vendorId: {
        type: Number,
        decimal: true
    },
    qty: {
        type: Number
    },
    branchId: {
        type: String
    }
});

Meteor.startup(function () {
    //LendingInventories.itemsSchema.i18n("pos.lendingInventory.schema");
    //LendingInventories.schema.i18n("pos.lendingInventory.schema");
    LendingInventories.attachSchema(LendingInventories.schema);
});
