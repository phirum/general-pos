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
import  {QuantityMappingTabular} from '../../../common/tabulars/quantityMapping';

import {QuantityRangeMapping} from '../../api/collections/quantityRangeMapping.js';
import {tmpCollection} from '../../api/collections/tmpCollection.js';
import './quantityRangeMapping.html';
let indexTmpl = Template.Pos_quantityRangeMapping,
    insertTmpl = Template.Pos_quantityRangeMappingNew,
    actionTmpl = Template.Pos_quantityRangeMappingAction,
    editTmpl = Template.Pos_quantityRangeMappingEdit,
    showTmpl = Template.Pos_quantityRangeMappingShow;

// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('quantityRangeMapping');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.quantityRangeMapping(fa('plus', 'Add New'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
    tabularTable(){
        return QuantityMappingTabular;
    }
});

//insert
insertTmpl.helpers({
    collection(){
        return QuantityRangeMapping;
    }
});

//update

editTmpl.helpers({
    collection(){
        return QuantityRangeMapping;
    },
    data(){
        return this;
    }
});
// actionTmpl
actionTmpl.events({
    'click .js-update'(event, instance){
        let data = this;
        alertify.quantityRangeMapping(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, data));
    },
    'click .js-display'(event, instance){
        alertify.quantityRangeMapping(fa('pencil', 'Display'), renderTemplate(showTmpl, this));
    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            QuantityRangeMapping,
            {_id: this._id},
            {title: 'Remove Unit', itemTitle: this._id}
        );
    }
});

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.quantityRangeMapping().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_quantityRangeMappingNew',
    'Pos_quantityRangeMappingEdit'
], hooksObject)
