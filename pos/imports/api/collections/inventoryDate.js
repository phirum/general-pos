import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

export const InventoryDates = new Mongo.Collection("pos_inventoryDates");

// InventoryDates schema
InventoryDates.schema = new SimpleSchema({
    stockLocationId: {
        type: String
    },
    branchId: {
        type: String
    },
    inventoryDate:{
        type:Date
    }
});

Meteor.startup(function () {
    //InventoryDates.itemsSchema.i18n("pos.averageInventory.schema");
    //InventoryDates.schema.i18n("pos.averageInventory.schema");
    InventoryDates.attachSchema(InventoryDates.schema);
});
