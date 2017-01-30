import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const WhiteListCustomer = new Mongo.Collection("pos_whiteListCustomer");

WhiteListCustomer.schema = new SimpleSchema({
    customerId: {
        type: String,
        unique: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search .... (Limit 10)',
                optionsMethod: 'pos.selectOptMethods.customer',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    limitTimes: {
        type: Number,
        min: 0
    },
    customerName: {
        type: String,
        optional: true
    }
});

Meteor.startup(function () {
    WhiteListCustomer.schema.i18n("pos.whiteListCustomer.schema");
    WhiteListCustomer.attachSchema(WhiteListCustomer.schema);
});
