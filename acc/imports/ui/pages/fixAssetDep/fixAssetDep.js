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
import {FixAssetDep} from '../../../api/collections/fixAssetDep';
import {ExchangeForFixAsset} from '../../../api/collections/reports/exchangeForFixAsset';


// Tabular
import {FixAssetDepTabular} from '../../../../common/tabulars/fixAssetDep';

// Page
import './fixAssetDep.html';
import '../../libs/getBranch';

// Declare template
var fixAssetDepTpl = Template.acc_fixAssetDep,
    fixAssetListTPL = Template.acc_fixAssetDepList,
    fixAssetDepSummaryListTpl = Template.acc_fixAssetDepSummaryList,
    exchangeForFixAssetTpl = Template.acc_exchangeForFixAsset;


fixAssetDepTpl.onRendered(function () {
    createNewAlertify("fixAssetDep");

})

fixAssetDepTpl.helpers({
    tabularTable(){
        return FixAssetDepTabular;
    },
    selector: function () {
        return {branchId: Session.get("currentBranch")};
    }
})


fixAssetDepTpl.events({
    'click .depList': function (e, t) {
        var self = this;

        var params = {};
        var queryParams = {};

        queryParams.branchId = Session.get("currentBranch");
        queryParams.journalId = self.journalId;

        var path = FlowRouter.path("acc.fixAssetDepList", params, queryParams);

        window.open(path, "_blank");

    },
    'click .fixedAssetSummaryDepreciation': function (e, t) {

        alertify.fixAssetDep(fa("plus", "Exchange"), renderTemplate(exchangeForFixAssetTpl)).minimize();
    }
});






fixAssetListTPL.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    },
    data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        Fetcher.setDefault('data', false);
        Fetcher.retrieve('data', 'acc_fixAssetDepList', q);

        return Fetcher.get('data');
    }
})

fixAssetDepSummaryListTpl.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    },
    data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        Fetcher.setDefault('data', false);
        Fetcher.retrieve('data', 'acc_fixAssetDepSummaryList', q);

        return Fetcher.get('data');
    }
})


//Pop up Exchange Date

exchangeForFixAssetTpl.events({
    'click .go': function (e,t) {


        let params = {};
        let queryParams = {};

        let exchangeId=$('[name="exchangeDate"]').val();

        queryParams.branchId = Session.get("currentBranch");
        queryParams.exchangeId = exchangeId;

        var path = FlowRouter.path("acc.fixAssetDepSummaryList", params, queryParams);

        window.open(path, "_blank");

        alertify.fixAssetDep().close();

    },
    'change [name="exchangeDate"]'(e,t){
        Session.set('exId',$(e.currentTarget).val());
    }


})
exchangeForFixAssetTpl.helpers({
    schema() {
        return ExchangeForFixAsset;
    },
    cssClassForSubmit(){
        if(Session.get('exId') =="" || Session.get('exId') == undefined){
            return 'disabled';
        }else{
            return "";
        }
    }
})

exchangeForFixAssetTpl.onDestroyed(function () {
    Session.set('exId',"");
})
