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

// Collection
import {AccountMapping} from '../../api/collections/accountMapping.js';

// Tabular
import {AccountMappingTabular} from '../../../common/tabulars/accountMapping.js';

// Page
import './accountMapping.html';

// Declare template
let indexTmpl = Template.Pos_accountMapping,
    actionTmpl = Template.Pos_accountMappingAction,
    newTmpl = Template.Pos_accountMappingNew,
    editTmpl = Template.Pos_accountMappingEdit,
    showTmpl = Template.Pos_accountMappingShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('accountMapping');
    createNewAlertify('accountMappingShow');
});


indexTmpl.helpers({
    tabularTable(){
        return AccountMappingTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.accountMapping(fa('plus', TAPi18n.__('pos.accountMapping.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.accountMapping(fa('pencil', TAPi18n.__('pos.accountMapping.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            AccountMapping,
            {_id: this._id},
            {title: TAPi18n.__('pos.accountMapping.title'), itemTitle: this._id}
        );
    },
});

// New
newTmpl.helpers({
    collection(){
        return AccountMapping;
    }
});

// Edit
editTmpl.onCreated(function () {

});

editTmpl.helpers({
    collection(){
        return AccountMapping;
    },
    data () {
        return this;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.rep', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.rep.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = AccountMapping.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.accountMapping().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_accountMappingNew',
    'Pos_accountMappingEdit'
], hooksObject);
