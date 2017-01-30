import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const StockAndAccountMapping = new Mongo.Collection("pos_stockAndAccountMapping");

StockAndAccountMapping.schema = new SimpleSchema({
    branchId: {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.branch',
                // optionsMethodParams: function () {
                //     if (Meteor.isClient) {
                //         let currentBranch = Meteor.isClient && Session.get('currentBranch');
                //         return {branchId: currentBranch};
                //     }
                // }
            }
        }
    },
    chartAccounts: {
        type: [String],
        optional: true
    },
    userId: {
        type: String,
        label: 'User',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.settingUser',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = AutoForm.getFieldValue('branchId') || Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    stockLocations: {
        type: [String],
        autoform: {
            type: 'universe-select',
            multiple: true,
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.stockLocation',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = AutoForm.getFieldValue('branchId') || Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }

    }
});

Meteor.startup(function () {
    StockAndAccountMapping.schema.i18n("pos.StockAndAccountMapping.schema");
    StockAndAccountMapping.attachSchema(StockAndAccountMapping.schema);
});
