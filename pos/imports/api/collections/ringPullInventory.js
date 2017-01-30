import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

export const RingPullInventories = new Mongo.Collection("pos_ringPullInventories");

// RingPullInventories schema
RingPullInventories.schema = new SimpleSchema({
    itemId: {
        type: String
    },
    qty: {
        type: Number
    },
    branchId: {
        type: String
    }
});

Meteor.startup(function () {
    //RingPullInventories.itemsSchema.i18n("pos.ringPullInventory.schema");
    //RingPullInventories.schema.i18n("pos.ringPullInventory.schema");
    RingPullInventories.attachSchema(RingPullInventories.schema);
});
