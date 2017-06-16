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
import {CompanyExchangeRingPulls} from '../../api/collections/companyExchangeRingPull.js';
import {Order} from '../../api/collections/order';
import {Item} from '../../api/collections/item';
import {deletedItem} from './companyExchangeRingPull-items';
import {VendorNullCollection, nullCollection} from '../../api/collections/tmpCollection';
// Tabular
import {CompanyExchangeRingPullTabular} from '../../../common/tabulars/companyExchangeRingPull.js';

// Page
import './companyExchangeRingPull.html';
import './companyExchangeRingPull-items.js';
import './info-tab.html';
import './vendor.html';
//methods
import {companyExchangeRingPullInfo} from '../../../common/methods/companyExchangeRingPull.js'
import {vendorInfo} from '../../../common/methods/vendor.js';

Tracker.autorun(function () {
    if (Session.get("getVendorId")) {
        vendorInfo.callPromise({_id: Session.get("getVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            });
    }
});

// Declare template
let indexTmpl = Template.Pos_companyExchangeRingPull,
    actionTmpl = Template.Pos_companyExchangeRingPullAction,
    newTmpl = Template.Pos_companyExchangeRingPullNew,
    editTmpl = Template.Pos_companyExchangeRingPullEdit,
    showTmpl = Template.Pos_companyExchangeRingPullShow;
// Local collection
let itemsCollection = nullCollection;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('companyExchangeRingPull', {size: 'lg'});
    createNewAlertify('companyExchangeRingPullShow', {size: 'lg'});
    createNewAlertify('vendor');
});

indexTmpl.helpers({
    tabularTable(){
        return CompanyExchangeRingPullTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});
indexTmpl.onDestroyed(function () {
    VendorNullCollection.remove({});
});
indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.companyExchangeRingPull(fa('cart-arrow-down', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        debugger;
        var data = this;
        Meteor.call('isCompanyExchangeRingPullHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    swal('បញ្ជាក់!', `សូមធ្វើការលុប Receive Item លេខ​ ${result} ជាមុនសិន!​​​​`, 'error');
                } else {
                    excuteEditForm(data);
                }
            }
        });
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isCompanyExchangeRingPullHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    swal('បញ្ជាក់!', `សូមធ្វើការលុប Receive Item លេខ​ ${result} ជាមុនសិន!​​​​`, 'error');
                } else {
                    destroyAction(
                        CompanyExchangeRingPulls,
                        {_id: id},
                        {title: TAPi18n.__('pos.companyExchangeRingPull.title'), itemTitle: id}
                    );
                }
            }
        });

    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting CompanyExchangeRingPulls....", showConfirmButton: false
        });
        Meteor.call('companyExchangeRingPullShowItem', {_id: this._id}, function (err, result) {
            swal.close();
            alertify.companyExchangeRingPullShow(fa('eye', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(showTmpl, result));
        });
    },
    'click .js-companyExchangeRingPull' (event, instance) {
        let params = {};
        let queryParams = {companyExchangeRingPullId: this._id};
        let path = FlowRouter.path("pos.companyExchangeRingPullReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});
//on rendered
newTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});
// New
newTmpl.events({
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.companyExchangeRingPull().close();
    },
    'change [name=vendorId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getVendorId', event.currentTarget.value);
            if (FlowRouter.query.get('vendorId')) {
                FlowRouter.query.set('vendorId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);
    },
});
newTmpl.helpers({
    repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
    },
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return [];
    },
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('vendorId')) {
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
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be companyExchangeRingPull: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return CompanyExchangeRingPulls;
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
    Session.set('vendorInfo', undefined);
    Session.set('getVendorId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});


editTmpl.events({
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.companyExchangeRingPull().close();
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    collection(){
        return CompanyExchangeRingPulls;
    },
    companyExchangeRingPullDate(){
        return this.companyExchangeRingPullDate;
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
     if (Session.get('vendorInfo')) {
     try {
     return Session.get('vendorInfo').repId;
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
        if (!FlowRouter.query.get('vendorId')) {
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
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be companyExchangeRingPull: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return CompanyExchangeRingPulls;
    },
    itemsCollection(){
        return itemsCollection;
    },
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('getVendorId', undefined);
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
        let key = `pos.companyExchangeRingPull.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    colorizeType(type) {
        if (type == 'term') {
            return `<label class="label label-info">T</label>`
        }
        return `<label class="label label-success">G</label>`
    },
    colorizeStatus(status){
        if (status == 'active') {
            return `<label class="label label-info">A</label>`
        } else if (status == 'partial') {
            return `<label class="label label-danger">P</label>`
        }
        return `<label class="label label-success">C</label>`
    }
});
showTmpl.events({
    'click .print-exchange-ring-pull-show'(event, instance){
        $('#to-print').printThis();
    }
});


function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting CompanyExchangeRingPulls....", showConfirmButton: false
    });
    alertify.companyExchangeRingPull(fa('pencil', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(editTmpl, doc)).maximize();
}
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            let sumRemainQty = 0;
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty;
                sumRemainQty += obj.qty;
                items.push(obj);
            });
            doc.sumRemainQty = sumRemainQty;
            doc.items = items;
            doc.status = 'active';
            return doc;
        },
        update: function (doc) {
            let items = [];
            let sumRemainQty = 0;
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty;
                sumRemainQty += obj.qty;
                items.push(obj);
            });
            doc.$set.sumRemainQty = sumRemainQty;
            doc.$set.items = items;
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, id) {
        //get companyExchangeRingPullId, total, vendorId
        if (formType != 'update') {
            if (!FlowRouter.query.get('vendorId')) {
                Meteor.call('getCompanyExchangeRingPullId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.companyExchangeRingPull().close();
            }
        } else {
            alertify.companyExchangeRingPull().close();
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
    'Pos_companyExchangeRingPullNew',
    'Pos_companyExchangeRingPullUpdate'
], hooksObject);
