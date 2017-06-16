import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import 'meteor/theara:jsonview';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';


// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {LocationTransfers} from '../../api/collections/locationTransfer.js';

// Tabular
import {LocationTransferTabular} from '../../../common/tabulars/locationTransfer.js';

// Page
import './locationTransfer.html';
import './locationTransfer-items.js';
import './info-tab.html';
//methods
import {LocationTransferInfo} from '../../../common/methods/locationTransfer.js'
import {vendorInfo} from '../../../common/methods/vendor.js';
//Tracker for vendor infomation
Tracker.autorun(function () {
    if (Session.get('vendorId')) {
        vendorInfo.callPromise({_id: Session.get('vendorId')})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
});
// Declare template
let indexTmpl = Template.Pos_locationTransfer,
    actionTmpl = Template.Pos_locationTransferAction,
    newTmpl = Template.Pos_locationTransferNew,
    editTmpl = Template.Pos_locationTransferEdit,
    showTmpl = Template.Pos_locationTransferShow;

// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('locationTransfer', {size: 'lg'});
    createNewAlertify('locationTransferShow');
});

indexTmpl.helpers({
    tabularTable(){
        return LocationTransferTabular;
    },
    selector() {
        return {fromBranchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.locationTransfer(fa('plus', TAPi18n.__('pos.locationTransfer.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        if(this.status=='active'){
            alertify.locationTransfer(fa('pencil', TAPi18n.__('pos.locationTransfer.title')), renderTemplate(editTmpl, this));
        }else{
            alertify.warning('Transaction is: '+this.status+' can not be update.');
        }
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        if(data.status=='active') {
            destroyAction(
                LocationTransfers,
                {_id: data._id},
                {title: TAPi18n.__('pos.locationTransfer.title'), itemTitle: data._id}
            );
        }else{
            alertify.warning('Transaction is: '+data.status+' can not be remove.');
        }
    },
    'click .js-display' (event, instance) {
        Meteor.call('pos.locationTransferInfo', {_id: this._id}, function (err, result) {
            if (result) {
                console.log(result);
                alertify.locationTransfer(fa('eye', 'Showing Transfer'), renderTemplate(showTmpl, result));
            }
            if (err) {
                console.log(err);
            }
        });
    },
    'click .js-locationTransfer' (event, instance) {
        let params = {};
        let queryParams = {locationTransferId: this._id};
        let path = FlowRouter.path("pos.locationTransferReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.onCreated(function () {
    this.branch = new ReactiveVar();
    Meteor.call('getBranch', Session.get('currentBranch'),(err,result)=> {
        if(result) {
            this.branch.set(result);
        }else{
            console.log(err);
        }

    })
});
newTmpl.events({
    'change [name=vendorId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('vendorId', event.currentTarget.value);
        }
    },
    'click #btn-save-print'(event, instance){
        Session.set('btnType', 'save-print');
    },
    'click #btn-save'(event, instance){
        Session.set('btnType', 'save');
    },
    'click #btn-pay'(event, instance){
        Session.set('btnType', 'pay');
    }
});
newTmpl.helpers({
    fromBranchId(){
        let instance = Template.instance();
        if(instance.branch.get()) {
            return instance.branch.get().enShortName;
        }
        return '';
    },
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be locationTransfer: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return LocationTransfers;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    },
    disabledPayBtn(){
        let cont = itemsCollection.find().count();
        let pay = $('[name="paidAmount"]').val();
        if (cont == 0 || pay == "") {
            return {disabled: true};
        }
        return {};
    }
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
});
// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.locationTransfer', {_id: this.data._id});
    });
});
editTmpl.events({
    'click #btn-save-print'(event, instance){
        Session.set('btnType', 'save-print');
    },
    'click #btn-save'(event, instance){
        Session.set('btnType', 'save');
    },
    'click #btn-pay'(event, instance){
        Session.set('btnType', 'pay');
    }
});
editTmpl.helpers({
    collection(){
        return LocationTransfers;
    },
    data () {
        let data = LocationTransfers.findOne(this._id);

        // Add items to local collection
        _.forEach(data.items, (value)=> {
            Meteor.call('getItem', value.itemId, function (err, result) {
                value.name = result.name;
                itemsCollection.insert(value);
            })
        });

        return data;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

editTmpl.onDestroyed(function () {
    debugger;
    // Remove items collection
    itemsCollection.remove({});
});

// Show

showTmpl.events({
   'click .print'(){
       $('#to-print').printThis();
   }
});
showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.locationTransfer.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    capitalize(name){
        return _.capitalize(name);
    },
    accepted(){
        if (!this.pending && this.status == 'closed') {
            return true;
        }
    },
    declined(){
        if (!this.pending && this.status == 'declined') {
            return true;
        }
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            debugger;
            var btnType = Session.get('btnType');
            if (btnType == "save" || btnType == "save-print") {
                doc.status = "active";
                doc.paidAmount = 0;
                doc.dueAmount = math.round(doc.total, 2);
            } else if (btnType == "pay") {
                doc.dueAmount = math.round((doc.total - doc.paidAmount), 2);
                if (doc.dueAmount <= 0) {
                    doc.status = "close";
                } else {
                    doc.status = "partial";
                }

            }
            doc.items = items;
            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            doc.$set.items = items;
            var btnType = Session.get('btnType');
            if (btnType == "save" || btnType == "save-print") {
                doc.$set.status = "active";
                doc.$set.paidAmount = 0;
                doc.$set.dueAmount = math.round(doc.total, 2);
            } else if (btnType == "pay") {
                doc.$set.dueAmount = math.round((doc.$set.total - doc.$set.paidAmount), 2);
                if (doc.$set.dueAmount <= 0) {
                    doc.$set.status = "close";
                } else {
                    doc.$set.status = "partial";
                }
            }
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, result) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        alertify.locationTransfer().close();
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_locationTransferNew',
    'Pos_locationTransferEdit'
], hooksObject);
