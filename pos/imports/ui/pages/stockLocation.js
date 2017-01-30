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
import {StockLocations} from '../../api/collections/stockLocation.js';

// Tabular
import {StockLocationTabular} from '../../../common/tabulars/stockLocation.js';

// Page
import './stockLocation.html';

// Declare template
let indexTmpl = Template.Pos_stockLocation,
    actionTmpl = Template.Pos_stockLocationAction,
    newTmpl = Template.Pos_stockLocationNew,
    editTmpl = Template.Pos_stockLocationEdit,
    showTmpl = Template.Pos_stockLocationShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('stockLocation', {size: 'lg'});
    createNewAlertify('stockLocationShow',);

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('pos.stockLocationByBranchFilter', ['branchId']);
    this.autorun(()=> {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.onDestroyed(()=>{
  ReactiveTable.clearFilters(['pos.stockLocationByBranchFilter']);
})

indexTmpl.helpers({
    tabularTable(){
        return StockLocationTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.stockLocation(fa('plus', TAPi18n.__('pos.stockLocation.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.stockLocation(fa('pencil', TAPi18n.__('pos.stockLocation.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isStockLocationHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        StockLocations,
                        {_id: id},
                        {title: TAPi18n.__('pos.stockLocation.title'), itemTitle: id}
                    );
                }
            }
        });

    },
    'click .js-display' (event, instance) {
        alertify.stockLocationShow(fa('eye', TAPi18n.__('pos.stockLocation.title')), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return StockLocations;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.stockLocation', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return StockLocations;
    },
    data () {
        let data = StockLocations.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.stockLocation', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.stockLocation.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = StockLocations.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.stockLocation().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_stockLocationNew',
    'Pos_stockLocationEdit'
], hooksObject);
