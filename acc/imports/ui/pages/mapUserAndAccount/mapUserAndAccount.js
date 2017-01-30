import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {__} from '../../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../../core/client/components/loading.js';
import '../../../../../core/client/components/column-action.js';
import '../../../../../core/client/components/form-footer.js';


// Collection
import {MapUserAndAccount} from '../../../api/collections/mapUserAndAccount';
// Tabular
import {MapUserAndAccountTabular} from '../../../../common/tabulars/mapUserAndAccount';
//Method
import {SpaceChar} from '../../../../common/configs/space';
// Page
import './mapUserAndAccount.html';
import './mapAccountDetail.html';
import './mapAccountDetail.js';

// Declare template
var indexTpl = Template.acc_mapUserAndAccount,
    insertTpl = Template.acc_mapUserAndAccountInsert,
    updateTpl = Template.acc_mapUserAndAccountUpdate;


var mapAccountDetailCollection = new Mongo.Collection(null);

/**
 * Index
 */

indexTpl.onRendered(function () {
    /* Create new alertify */
    createNewAlertify("mapUserAndAccount");
});

indexTpl.events({
    'click .insert': function (e, t) {
        debugger;
        alertify.mapUserAndAccount(fa("plus", "Map User and Account"), renderTemplate(insertTpl));

    }, 'click .update': function (e, t) {
        var self = this;
        alertify.mapUserAndAccount(fa("pencil", "Map User and Account"), renderTemplate(updateTpl, self));

    },
    'click .remove': function (e, t) {
        var id = this._id;
        alertify.confirm(
            fa("remove", "Map User and Account"),
            "Are you sure to delete [" + id + "]?",
            function () {

                let result = MapUserAndAccount.remove({_id: id});
                if (result) {
                    alertify.success("Success");
                } else {
                    alertify.error("Can't remove");
                }
            },
            null
        );
    }

});

indexTpl.helpers({
    tabularTable(){
        return MapUserAndAccountTabular;
    }
})

insertTpl.helpers({
    collection(){
        return MapUserAndAccount;
    },

    mapAccountDetailCollection(){
        return mapAccountDetailCollection;
    }
})

updateTpl.helpers({
    collection(){
        return MapUserAndAccount;
    },

    mapAccountDetailCollection(){
        return mapAccountDetailCollection;
    }
})


/**
 * Hook
 */
AutoForm.hooks({
    acc_mapUserAndAccountInsert: {
        before: {
            insert: function (doc) {

                doc.branchId = Session.get("currentBranch");
                let transactionData = mapAccountDetailCollection.find().fetch();

                var transaction = [];
                transactionData.forEach(function (obj) {
                    transaction.push({chartAccount: obj.chartAccount})
                });
                doc.transaction = transaction;
                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.mapUserAndAccount().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    },
    acc_mapUserAndAccountUpdate: {
        before: {
            update: function (doc) {
                debugger;

                doc.$set.branchId = Session.get("currentBranch");
                let transactionData = mapAccountDetailCollection.find().fetch();

                var transaction = [];
                transactionData.forEach(function (obj) {
                    transaction.push({chartAccount: obj.chartAccount})
                });
                doc.$set.transaction = transaction;
                doc.$unset={};
                return doc;
            }
        },
        onSuccess: function (formType, result) {
            alertify.mapUserAndAccount().close();
            alertify.success('Success');
        },
        onError: function (formType, error) {
            alertify.error(error.message);
        }
    }
});
