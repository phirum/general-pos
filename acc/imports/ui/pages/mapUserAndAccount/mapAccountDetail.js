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
import {mapAccountDetail} from '../../../api/collections/mapUserAndAccount';

//Method
import {SpaceChar} from '../../../../common/configs/space';
// Page
import './mapAccountDetail.html';
import '../../libs/select2-for-chartAccount.js';
// Declare template
var mapAccountDetailTPL = Template.acc_mapAccountDetail;


var mapAccountDetailCollection;

//Created
mapAccountDetailTPL.onCreated(function () {
    let data = Template.currentData();
    mapAccountDetailCollection = data.mapAccountDetailCollection;
    mapAccountDetailCollection.remove({});

    if (data.transaction) {
        data.transaction.forEach(function (obj) {
            mapAccountDetailCollection.insert(obj);
        })
    }
})


mapAccountDetailTPL.onRendered(function () {
    select2chartAccount($("[name='chartAccount']"));
})

/**
 * JournalDetail
 */
mapAccountDetailTPL.helpers({
    detail () {
        let i = 1;
        let chartAccount = mapAccountDetailCollection.find().fetch();
        chartAccount.forEach(function (c) {
            c.index = i;
            i++;

        })
        return chartAccount;
    },
    schema(){

        return mapAccountDetail;
    }
});

mapAccountDetailTPL.events({
    'click .addItem': function (e, t) {

        var detail = {};
        detail.chartAccount = t.$('[name="chartAccount"]').val();
        mapAccountDetailCollection.insert(detail);
    },
    'click .removeItem': function (e, t) {
        var self = this;
        mapAccountDetailCollection.remove(self._id);
    }
});




