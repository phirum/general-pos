import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

export const Penalty = new Mongo.Collection("pos_penalty");
Penalty.schema = new SimpleSchema({
    rate: {
        type: Number,
        label: 'Rate(%)',
        decimal:true
    }
});

Meteor.startup(function () {
    // Penalty.schema.i18n("pos..schema");
    Penalty.attachSchema(Penalty.schema);
});