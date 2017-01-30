import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {Template} from 'meteor/templating';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {AccountIntegrationSetting} from '../../api/collections/accountIntegrationSetting.js';
import './accountIntegrationSetting.html';
let indexTmpl = Template.Pos_accountIntegrationSetting;
indexTmpl.onCreated(function () {
    Meteor.subscribe('pos.accountIntegrationSetting');
    this.data = AccountIntegrationSetting.findOne();
});

//update
indexTmpl.helpers({
    collection(){
        return AccountIntegrationSetting;
    },
    data(){
        return AccountIntegrationSetting.findOne();
    }
});
indexTmpl.events({
    'click #save-integrate'(){

    }
});
// actionTmpl
let hooksObject = {
    onSuccess (formType, result) {
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_accountIntegrationSettingNew',
    'Pos_accountIntegrationSettingEdit'
], hooksObject);
