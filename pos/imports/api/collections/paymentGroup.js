import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const PaymentGroups = new Mongo.Collection("pos_paymentGroups");
PaymentGroups.schema = new SimpleSchema({
    name: {
        type: String,
        //unique: true,
        max: 200
    },
    numberOfDay:{
        type:Number
    },
    description:{
        type:String,
        optional:true
    }
});

Meteor.startup(function () {
    PaymentGroups.schema.i18n("pos.paymentGroup.schema");
    PaymentGroups.attachSchema(PaymentGroups.schema);
});