import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {ReactiveMethod} from 'meteor/simple:reactive-method';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';
// Page
import './requirePassword.html';
// Collection
import {RequirePassword} from '../../api/collections/requirePassword.js';

// Tabular
import {RequirePasswordTabular} from '../../../common/tabulars/requirePassword.js';



// Declare template
let indexTmpl = Template.Pos_requirePassword,
    actionTmpl = Template.Pos_requirePasswordAction,
    newTmpl = Template.Pos_requirePasswordNew,
    editTmpl = Template.Pos_requirePasswordEdit,
    showTmpl = Template.Pos_requirePasswordShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('requirePassword');
    createNewAlertify('requirePasswordShow');

    // Reactive table filter
});

indexTmpl.helpers({
    tabularTable(){
        return RequirePasswordTabular;
    },
    selector() {
        return {};
    }

});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.requirePassword(fa('plus', 'Add New'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        Session.set('CategoryIdSession', this._id);
        alertify.requirePassword(fa('pencil', TAPi18n.__('pos.requirePassword.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            RequirePassword,
            {_id: this._id},
            {title: "Remove", itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.requirePasswordShow(fa('eye', TAPi18n.__('pos.requirePassword.title')), renderTemplate(showTmpl, this));
    }
});

newTmpl.onCreated(function () {


});
// New
newTmpl.helpers({
    collection(){
        return RequirePassword;
    }
});

// Edit
editTmpl.onCreated(function () {

});

editTmpl.helpers({
    collection(){
        return RequirePassword;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.requirePassword', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.requirePassword.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = RequirePassword.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.requirePassword().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_requirePasswordNew',
    'Pos_requirePasswordEdit'
], hooksObject);
