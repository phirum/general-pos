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
import  {UnitTabular} from '../../../common/tabulars/unit';

import {Units} from '../../api/collections/units.js';
import './unit.html';
let indexTmpl = Template.Pos_unit,
    insertTmpl = Template.Pos_unitNew,
    actionTmpl = Template.Pos_unitAction,
    editTmpl = Template.Pos_unitEdit,
    showTmpl = Template.Pos_unitShow;
// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('unit');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.unit(fa('plus', 'unit'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
    tabularTable(){
        return UnitTabular;
    }
});

//insert
insertTmpl.helpers({
    collection(){
        return Units;
    }
});

//update
editTmpl.helpers({
    collection(){
        return Units;
    }
})
// actionTmpl
actionTmpl.events({
    'click .js-update'(event, instance){
        let data = Template.currentData();
        alertify.unit(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, data));
    },
    'click .js-display'(event, instance){
        alertify.unit(fa('pencil', 'Display'), renderTemplate(showTmpl, this));

    },
    'click .js-destroy'(event, instance) {
        var id = this._id;
        Meteor.call('isUnitHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        Units,
                        {_id: id},
                        {title: 'Remove Unit', itemTitle: id}
                    );
                }
            }
        });


    }
})

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.unit().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_unitNew',
    'Pos_unitEdit'
], hooksObject)
