import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {Template} from 'meteor/templating';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';

//import tabular
import  {TargetItemTabular} from '../../../common/tabulars/targetItem';

import {TargetItem} from '../../api/collections/targetItem.js';
import {tmpCollection} from '../../api/collections/tmpCollection.js';
import './targetItem.html';
let indexTmpl = Template.Pos_targetItem,
    insertTmpl = Template.Pos_targetItemNew,
    actionTmpl = Template.Pos_targetItemAction,
    editTmpl = Template.Pos_targetItemEdit,
    showTmpl = Template.Pos_targetItemShow;

// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('targetItem');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.targetItem(fa('plus', 'Add New'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
    tabularTable(){
        return TargetItemTabular;
    }
});

//insert
insertTmpl.helpers({
    collection(){
        return TargetItem;
    }
});

//update

editTmpl.helpers({
    collection(){
        return TargetItem;
    },
    data(){
        return this;
    }
});
// actionTmpl
actionTmpl.events({
    'click .js-update'(event, instance){
        let data = this;
        alertify.targetItem(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, data));
    },
    'click .js-display'(event, instance){
        alertify.targetItem(fa('pencil', 'Display'), renderTemplate(showTmpl, this));
    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            TargetItem,
            {_id: this._id},
            {title: 'Remove Unit', itemTitle: this._id}
        );
    }
});

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.targetItem().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_targetItemNew',
    'Pos_targetItemEdit'
], hooksObject)
