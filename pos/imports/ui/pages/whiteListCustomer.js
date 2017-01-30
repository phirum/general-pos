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
import './whiteListCustomer.html';
// Collection
import {WhiteListCustomer} from '../../api/collections/whiteListCustomer.js';

// Tabular
import {WhiteListCustomerTabular} from '../../../common/tabulars/whiteListCustomer.js';



// Declare template
let indexTmpl = Template.Pos_whiteListCustomer,
    actionTmpl = Template.Pos_whiteListCustomerAction,
    newTmpl = Template.Pos_whiteListCustomerNew,
    editTmpl = Template.Pos_whiteListCustomerEdit,
    showTmpl = Template.Pos_whiteListCustomerShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('whiteListCustomer');
    createNewAlertify('whiteListCustomerShow');

    // Reactive table filter
});

indexTmpl.helpers({
    tabularTable(){
        return WhiteListCustomerTabular;
    },
    selector() {
        return {};
    }

});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.whiteListCustomer(fa('plus', 'Add New'), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.whiteListCustomer(fa('pencil', TAPi18n.__('pos.whiteListCustomer.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            WhiteListCustomer,
            {_id: this._id},
            {title: "Remove", itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.whiteListCustomerShow(fa('eye', TAPi18n.__('pos.whiteListCustomer.title')), renderTemplate(showTmpl, this));
    }
});

newTmpl.onCreated(function () {


});
// New
newTmpl.helpers({
    collection(){
        return WhiteListCustomer;
    }
});

// Edit
editTmpl.onCreated(function () {

});

editTmpl.helpers({
    collection(){
        return WhiteListCustomer;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.whiteListCustomer', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.whiteListCustomer.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = WhiteListCustomer.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.whiteListCustomer().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_whiteListCustomerNew',
    'Pos_whiteListCustomerEdit'
], hooksObject);
