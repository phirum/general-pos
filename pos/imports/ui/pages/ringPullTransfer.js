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
import {RingPullTransfers} from '../../api/collections/ringPullTransfer.js';
import {Order} from '../../api/collections/order';
import {Item} from '../../api/collections/item';
import {deletedItem} from './ringPullTransfer-items';
import {CustomerNullCollection, nullCollection} from '../../api/collections/tmpCollection';
// Tabular
import {RingPullTransferTabular} from '../../../common/tabulars/ringPullTransfer.js';

// Page
import './ringPullTransfer.html';
import './ringPullTransfer-items.js';
import './info-tab.html';
import './customer.html';
//methods
import {ringPullTransferInfo} from '../../../common/methods/ringPullTransfer.js'
import {customerInfo} from '../../../common/methods/customer.js';

Tracker.autorun(function () {
    if (Session.get("getCustomerId")) {
        customerInfo.callPromise({_id: Session.get("getCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            });
    }
});

// Declare template
let indexTmpl = Template.Pos_ringPullTransfer,
    actionTmpl = Template.Pos_ringPullTransferAction,
    newTmpl = Template.Pos_ringPullTransferNew,
    editTmpl = Template.Pos_ringPullTransferEdit,
    showTmpl = Template.Pos_ringPullTransferShow
// Local collection
let itemsCollection = nullCollection;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('ringPullTransfer', {size: 'lg'});
    createNewAlertify('ringPullTransferShow',);
    createNewAlertify('customer');
});

indexTmpl.helpers({
    tabularTable(){
        return RingPullTransferTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, fromBranchId: Session.get('currentBranch')};
    }
});
indexTmpl.onDestroyed(function () {
    CustomerNullCollection.remove({});
});
indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.ringPullTransfer(fa('cart-arrow-down', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        // if (this.saleId || (this.ringPullTransferType == 'term' && this.status != 'closed')) {
        //     excuteEditForm(this);
        // }
        // else if (this.ringPullTransferType == 'term' && this.status == 'closed') {
        //     // swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រលេខ ${this._id} ជាមុនសិន`, "error")
        //     excuteEditForm(this);
        //
        // }
        // else if (this.paymentGroupId) {
        //     Meteor.call('pos.isGroupRingPullTransferClosed', {_id: this.paymentGroupId}, (err, result)=> {
        //         if (result.paid) {
        //             swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រក្រុមលេខ ${this.paymentGroupId} ជាមុនសិន`, "error")
        //         } else {
        //             excuteEditForm(this);
        //         }
        //     });
        // }
        if (this.status == 'active') {
            excuteEditForm(this);
        } else {
            alertify.warning('Transaction is: ' + this.status + ' can not be update.');
        }
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        if (data.status == 'active') {
            destroyAction(
                RingPullTransfers,
                {_id: data._id},
                {title: TAPi18n.__('pos.ringPullTransfer.title'), itemTitle: data._id}
            );
        } else {
            alertify.warning('Transaction is: ' + data.status + ' can not be remove.');
        }
    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting RingPullTransfers....", showConfirmButton: false
        });
        Meteor.call('ringPullTransferShowItems', {_id: this._id}, function (err, result) {
            swal.close();
            alertify.ringPullTransferShow(fa('eye', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-ringPullTransfer' (event, instance) {
        let params = {};
        let queryParams = {ringPullTransferId: this._id};
        let path = FlowRouter.path("pos.ringPullTransferReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});
//on rendered
newTmpl.onCreated(function () {
    this.branch = new ReactiveVar();
    Meteor.call('getBranch', Session.get('currentBranch'), (err, result)=> {
        if (result) {
            this.branch.set(result);
        } else {
            console.log(err);
        }

    })
});
// New
newTmpl.events({
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.ringPullTransfer().close();
    },
    'change [name=customerId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getCustomerId', event.currentTarget.value);
            if (FlowRouter.query.get('customerId')) {
                FlowRouter.query.set('customerId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);
    },
});
newTmpl.helpers({
    fromBranchId(){
        let instance = Template.instance();
        if (instance.branch.get()) {
            return instance.branch.get().enShortName;
        }
        return '';
    },
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('customerId')) {
            itemsCollection.find().forEach(function (item) {
                total += item.amount;
            });
        }
        if (Session.get('totalOrder')) {
            let totalOrder = Session.get('totalOrder');
            return totalOrder;
        }
        return {total};
    },
    customerInfo() {
        let customerInfo = Session.get('customerInfo');
        if (!customerInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${customerInfo.telephone ? customerInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be ringPullTransfer: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return RingPullTransfers;
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
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Edit
editTmpl.onCreated(function () {
});


editTmpl.events({
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.ringPullTransfer().close();
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    collection(){
        return RingPullTransfers;
    },
    data () {
        let data = this;
        // Add items to local collection
        _.forEach(data.items, (value)=> {
            Meteor.call('getItem', value.itemId, (err, result)=> {
                value.name = result.name;
                value.saleId = this.saleId;
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
    },
    /* repId(){
     if (Session.get('customerInfo')) {
     try {
     return Session.get('customerInfo').repId;
     } catch (e) {

     }
     }
     return '';
     },*/
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('customerId')) {
            itemsCollection.find().forEach(function (item) {
                total += item.amount;
            });
        }
        if (Session.get('totalOrder')) {
            let totalOrder = Session.get('totalOrder');
            return totalOrder;
        }
        return {total};
    },
    customerInfo() {
        let customerInfo = Session.get('customerInfo');
        if (!customerInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${customerInfo.telephone ? customerInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be ringPullTransfer: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return RingPullTransfers;
    },
    itemsCollection(){
        return itemsCollection;
    },
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Show

showTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    i18nLabel(label){
        let key = `pos.ringPullTransfer.schema.${label}.label`;
        return TAPi18n.__(key);
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
    capitalize(name){
        return _.capitalize(name);
    }
});
showTmpl.events({
    'click .print-ringPullTransfer-show'(event, instance){
        $('#to-print').printThis();
    }
});


function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting RingPullTransfers....", showConfirmButton: false
    });
    alertify.ringPullTransfer(fa('pencil', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(editTmpl, doc)).maximize();
}
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];

            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
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
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, id) {
        //get ringPullTransferId, total, customerId
        if (formType != 'update') {
            if (!FlowRouter.query.get('customerId')) {
                Meteor.call('getRingPullTransferId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.ringPullTransfer().close();
            }
        } else {
            alertify.ringPullTransfer().close();
        }
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        deletedItem.remove({});
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_ringPullTransferNew',
    'Pos_ringPullTransferUpdate'
], hooksObject);
