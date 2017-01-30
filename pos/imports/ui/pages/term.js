import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {Template} from 'meteor/templating';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';

import {Terms} from '../../api/collections/terms.js';
//import tabular 
import  {termTabular} from '../../../common/tabulars/term';
import './term.html';
let indexTmpl = Template.Pos_term,
    insertTmpl = Template.Pos_termNew,
    actionTmpl = Template.Pos_termAction,
    editTmpl = Template.Pos_termEdit,
    showTmpl = Template.Pos_termShow;
// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('term');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.term(fa('plus', 'term'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
    tabularTable(){
        return termTabular;
    }
});

//insert
insertTmpl.helpers({
    collection(){
        return Terms;
    }
});

//update
editTmpl.helpers({
    collection(){
        return Terms;
    }
})
// actionTmpl
actionTmpl.events({
    'click .js-update'(event, instance){
        alertify.term(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, this));
    },
    'click .js-display'(event, instance){
        alertify.term(fa('pencil', 'Display'), renderTemplate(showTmpl, this));

    },
    'click .js-destroy'(event, instance) {
        var id = this._id;
        Meteor.call('isTermHasRelation',id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        Terms,
                        {_id: id},
                        {title: 'pos.term.title', itemTitle: id}
                    );
                }
            }
        });


    }
})

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.term().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_termNew',
    'Pos_termEdit'
], hooksObject)
