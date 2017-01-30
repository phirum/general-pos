import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts';
/**
 * Collection
 *
 * @type {Mongo.Collection}
 */
export const MapUserAndAccount = new Mongo.Collection('accMapUserAndAccount');

/**
 * Schema
 *
 * @type {AccSchema}
 */
MapUserAndAccount.schema = new SimpleSchema({

    userId: {
        type: String,
        label: "User Name",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.getUserList();
            }
        }
    },
    transaction: {
        type: Array,
        optional: true
    },
    'transaction.$': {
        type: Object
    },
    'transaction.$.chartAccount': {
        type: String,
        max: 200,
        label: "Account"
    },
    
    branchId:{
        type: String,
        optional: true
    },
    userName: {
        type: String,
        optional: true
    }
});
/**
 * Attach schema
 */

export const mapAccountDetail = new SimpleSchema({
    chartAccount: {
        type: String,
        label: "Chart Account",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.chartAccount();
            }
        }
    }
});
Meteor.startup(function () {
    MapUserAndAccount.schema.i18n("acc.mapUserAndAccount.schema");
    mapAccountDetail.i18n("acc.mapAccountDetail.schema");
    MapUserAndAccount.attachSchema(MapUserAndAccount.schema);
});

