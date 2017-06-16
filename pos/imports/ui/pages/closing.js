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
import RangeDate from '../../api/libs/date';
// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {Closing} from '../../api/collections/closing.js';

// Tabular
import {ClosingTabular} from '../../../common/tabulars/closing';

// Page
import './closing.html';

// Declare template
let indexTmpl = Template.Pos_closing,
    actionTmpl = Template.Pos_closingAction,
    newTmpl = Template.Pos_closingNew,
    editTmpl = Template.Pos_closingEdit,
    showTmpl = Template.Pos_closingShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('closing');
    createNewAlertify('closinghow');
});

indexTmpl.helpers({
    tabularTable(){
        return ClosingTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.closing(fa('plus', TAPi18n.__('cement.closing.title')), renderTemplate(newTmpl));
    },
    'click .js-destroy' (event, instance) {
        let id = this._id;
        let data = this;
        Meteor.call('checkRemoveClosingDate', this.date, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
               if(!result){
                    destroyAction(
                        Closing,
                        {_id: id},
                        {title: TAPi18n.__('cement.closing.title'), itemTitle: id}
                    );
               }else{
                    let qDate = moment(result.closingDate).format('YYYY-MM-DD');
                    let currentDate = moment(data.closingDate).format('YYYY-MM-DD');
                    if(moment(qDate).isSameOrBefore(currentDate)){
                        destroyAction(
                            Closing,
                            {_id: id},
                            {title: TAPi18n.__('cement.closing.title'), itemTitle: id}
                        );
                    }else{
                        alertify.warning('Please Remove Last Date First')
                    }
               }
            }
        });

    },
    'click .js-display' (event, instance) {
        alertify.closinghow(fa('eye', TAPi18n.__('cement.closing.title')), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Closing;
    }
});
newTmpl.onRendered(function(){
    RangeDate.checkMinPlusOneDay($('[name="closingDate"]'));
});
// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('cement.rep', {_id: this.data._id});
    });
});
editTmpl.onRendered(function(){
    RangeDate.checkMinPlusOneDay($('[name="closingDate"]'));
});
editTmpl.helpers({
    collection(){
        return Closing;
    },
    data () {
        let data = Closing.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('cement.rep', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `cement.rep.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = Closing.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.closing().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_closingNew',
    'Pos_closingEdit'
], hooksObject);

