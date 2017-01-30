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
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {__} from '../../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../../core/client/components/loading.js';
import '../../../../../core/client/components/column-action.js';
import '../../../../../core/client/components/form-footer.js';

// Collection
import {ReceiveItems} from '../../../api/collections/receiveItem.js';
import {PrepaidOrders} from '../../../api/collections/prepaidOrder.js';
import {ExchangeGratis} from '../../../api/collections/exchangeGratis.js';
import {ReceiveDeletedItem} from './receiveItem-items.js';
import {Item} from '../../../api/collections/item';
import {vendorBillCollection} from '../../../api/collections/tmpCollection';
// Tabular
import {ReceiveItemTabular} from '../../../../common/tabulars/receiveItem.js';

// Page
import './receiveItem.html';
import './receiveItem-items.js';
import '../info-tab.html';
import './lendingStock.js';
import './exchangeGratis.js';
import './companyExchangeRingPull.js';
//methods
import {ReceiveItemInfo} from '../../../../common/methods/receiveItem.js'
import {vendorInfo} from '../../../../common/methods/vendor.js';
//import receive item tracker
import '../../../../imports/api/tracker/receiveItem';
//Tracker for vendor infomation
Tracker.autorun(function () {
    if (Session.get("getVendorId")) {
        vendorInfo.callPromise({_id: Session.get("getVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
    if (Session.get('prepaidOrderItems')
        || Session.get('lendingStockItems')
        || Session.get('companyExchangeRingPullItems')
        || Session.get('exchangeGratisItems')
    ) {
        let query = FlowRouter.query;
        var data;
        if (query.get('type') == 'activeLendingStock') {
            data = Session.get('lendingStockItems');
        } else if (query.get('type') == 'activePrepaidOrder') {
            data = Session.get('prepaidOrderItems');
        } else if (query.get('type') == 'activeCompanyExchangeRingPull') {
            data = Session.get('companyExchangeRingPullItems');
        } else if (query.get('type') == 'activeExchangeGratis') {
            data = Session.get('exchangeGratisItems');
        }
        Meteor.subscribe('pos.item', {_id: {$in: data}});
    }

});
// Declare template
let indexTmpl = Template.Pos_receiveItem,
    actionTmpl = Template.Pos_receiveItemAction,
    newTmpl = Template.Pos_receiveItemNew,
    editTmpl = Template.Pos_receiveItemEdit,
    showTmpl = Template.Pos_receiveItemShow,
    listPrepaidOrder = Template.listPrepaidOrder,
    listCompanyExchangeRingPull = Template.listCompanyExchangeRingPull,
    listExchangeGratis = Template.listExchangeGratis,
    listLendingStock = Template.listLendingStock;
// Local collection
import {itemsCollection} from '../../../api/collections/tmpCollection';

// Index

indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('receiveItem', {size: 'lg'});
    createNewAlertify('receiveItemShow');
    createNewAlertify('listPrepaidOrder', {size: 'lg'});
    createNewAlertify('listLendingStock', {size: 'lg'});
    createNewAlertify('listCompanyExchangeRingPull', {size: 'lg'});
    createNewAlertify('listExchangeGratis', {size: 'lg'});
    createNewAlertify('vendor');
});

indexTmpl.helpers({
    tabularTable(){
        return ReceiveItemTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.receiveItem(fa('plus', TAPi18n.__('pos.receiveItem.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        itemsCollection.remove({});
        alertify.receiveItem(fa('pencil', TAPi18n.__('pos.receiveItem.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        destroyAction(
            ReceiveItems,
            {_id: data._id},
            {title: TAPi18n.__('pos.receiveItem.title'), itemTitle: data._id}
        );
    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting Invoices....", showConfirmButton: false
        });
        // this.customer = vendorBillCollection.findOne(this.vendorId).name;
        Meteor.call('billShowItems', {doc: this}, function (err, result) {
            swal.close();
            alertify.receiveItemShow(fa('eye', TAPi18n.__('pos.invoice.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-receiveItem' (event, instance) {
        let params = {};
        let queryParams = {receiveItemId: this._id};
        let path = FlowRouter.path("pos.receiveItemReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});
indexTmpl.onDestroyed(function () {
    vendorBillCollection.remove({});
    FlowRouter.query.unset();
});
newTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});
// New
newTmpl.events({
    'click .toggle-list'(event, instance){
        let receiveType = $('#receive-type').val();
        let vendor = $('[name="vendorId"]').val();
        receiveTypeFn({receiveType, vendor});
    },

    'change [name=vendorId]'(event, instance){
        itemsCollection.remove({});
        $('#receive-type').val('');
        if (event.currentTarget.value != '') {
            $('.toggle-list').addClass('hidden');
            Session.set('getVendorId', event.currentTarget.value);
        } else {
            Session.set('getVendorId', undefined);
            FlowRouter.query.unset();
        }
        Session.set('totalOrder', undefined);
    },
    'click .go-to-pay-bill'(event, instance){
        alertify.receiveItem().close();
    },
    'change #receive-type'(event, instance){
        let receiveType = event.currentTarget.value;
        let vendor = $('[name="vendorId"]').val();
        $('.toggle-list').removeClass('hidden');
        receiveTypeFn({receiveType, vendor});
    }
});
newTmpl.helpers({
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
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').termId;
            } catch (e) {

            }
        }
        return '';
    },
    totalReceiveItem(){
        let total = 0;
        itemsCollection.find().forEach(function (item) {
            total += item.amount;
        });
        return total;
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
              <li>Prepaid Order to be receiveItem: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return ReceiveItems;
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
    },
    /* isTerm(){
     if (Session.get('vendorInfo')) {
     let vendorInfo = Session.get('vendorInfo');
     if (vendorInfo._term) {
     return true;
     }
     return false;
     }
     },*/
    dueDate(){
        let date = AutoForm.getFieldValue('receiveItemDate');
        if (Session.get('vendorInfo')) {
            if (Session.get('vendorInfo')._term) {
                let term = Session.get('vendorInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    },
    enableReceiveType(){
        if (Session.get('getVendorId')) {
            return false
        }
        return true;
    }
});

newTmpl.onDestroyed(function () {
    debugger;
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
    FlowRouter.query.unset();
    Session.set('prepaidOrderItems', undefined);
    Session.set('totalOrder', undefined);
    Session.set('getVendorId', undefined);
});
// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    let type = FlowRouter.query.get('type');
    let data = this.data;
    let typeId = _.lowerFirst(data.type)+'Id';
    // Add items to local collection
    _.forEach(data.items, (value) => {
        Meteor.call('getItem', value.itemId, function (err, result) {
            value.name = result.name;
            value[typeId] = data[typeId];
            value.exactQty = value.qty + value.lostQty;
            itemsCollection.insert(value);
        })
    });
});
editTmpl.events({
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-pay-bill'(event, instance){
        alertify.invoice().close();
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
    'click .toggle-list'(event, instance){
        let receiveType = $('#receive-type').val();
        let vendor = $('[name="vendorId"]').val();
        receiveTypeFn({receiveType, vendor});
    },
    'change [name="termId"]'(event, instance){
        let vendorInfo = Session.get('vendorInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            vendorInfo._term.netDueIn = result.netDueIn;
            Session.set('vendorInfo', vendorInfo);
        });
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    isPrepaidOrder(){
        return Template.instance().isPrepaidOrder.get();
    },
    collection(){
        return ReceiveItems;
    },
    data () {
        let data = this;
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
    repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').termId;
            } catch (e) {

            }
        }
        return '';
    },
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
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
              <li>Prepaid Order to be invoice: <span class="label label-primary">0</span>`
        };
    },
    repId(){
        if (Session.get('vendorInfo')) {
            return Session.get('vendorInfo').repId;
        }
    },
    dueDate(){
        let date = AutoForm.getFieldValue('receiveItemDate');
        if (Session.get('vendorInfo')) {
            if (Session.get('vendorInfo')._term) {
                let term = Session.get('vendorInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    },
    isTerm(){
        if (Session.get('vendorInfo')) {
            let vendorInfo = Session.get('vendorInfo');
            if (vendorInfo._term) {
                return true;
            }
            return false;
        }
    }
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    ReceiveDeletedItem.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
    FlowRouter.query.unset();
    Session.set('prepaidOrderItems', undefined);
    Session.set('totalOrder', undefined);
    Session.set('getVendorId', undefined);
});

// Show
showTmpl.onCreated(function () {

});

showTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
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
    'click .print-bill-show'(event, instance){
        $('#to-print').printThis();
    }
});
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            debugger;
            let items = [];
            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                if (obj.prepaidOrderId) {
                    doc.prepaidOrderId = obj.prepaidOrderId;
                } else if (obj.lendingStockId) {
                    doc.lendingStockId = obj.lendingStockId;
                } else if (obj.exchangeGratisId) {
                    doc.exchangeGratisId = obj.exchangeGratisId;
                } else if (obj.companyExchangeRingPullId) {
                    doc.companyExchangeRingPullId = obj.companyExchangeRingPullId;
                }
                items.push(obj);
            });
            doc.type = $('#receive-type').val();
            doc.status = 'closed';
            doc.items = items;
            return doc;
        },
        update: function (doc) {
            doc.$set.items = itemsCollection.find().fetch();
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, id) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        if (formType != 'update') {
            if (!FlowRouter.query.get('vendorId')) {
                Meteor.call('getBillId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.receiveItem().close();
            }
        } else {
            alertify.receiveItem().close();
        }
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_receiveItemNew',
    'Pos_receiveItemEdit'
], hooksObject);


//listPrepaidOrder
listPrepaidOrder.helpers({
    prepaidOrders(){
        let item = [];
        let prepaidOrders = PrepaidOrders.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).fetch();
        if (ReceiveDeletedItem.find().count() > 0) {
            ReceiveDeletedItem.find().forEach(function (item) {
                prepaidOrders.forEach(function (prepaidOrder) {
                    prepaidOrder.items.forEach(function (prepaidOrderItem) {
                        if (prepaidOrderItem.itemId == item.itemId) {
                            prepaidOrderItem.remainQty += item.qty;
                            prepaidOrder.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        prepaidOrders.forEach(function (prepaidOrder) {
            prepaidOrder.items.forEach(function (prepaidOrderItem) {
                item.push(prepaidOrderItem.itemId);
            });
        });
        Session.set('prepaidOrderItems', item);
        return prepaidOrders;
    },
    hasPrepaidOrders(){
        let count = PrepaidOrders.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).count();
        return count > 0;
    },
    getItemName(itemId){
        try {
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});
listPrepaidOrder.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.remain-qty').val();
        let prepaidOrderId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.prepaidOrderId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        debugger
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let prepaidOrderIdExist = _.find(tmpCollection, function (o) {
                        return o.prepaidOrderId == prepaidOrderId;
                    });
                    if (prepaidOrderIdExist) {
                        insertPrepaidOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            prepaidOrderItem: prepaidOrderIdExist,
                            prepaidOrderId: prepaidOrderId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same prepaidOrderId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result) => {
                        this.prepaidOrderId = prepaidOrderId;
                        this.qty = parseFloat(remainQty);
                        this.name = result.name;
                        this.exactQty = parseFloat(remainQty);
                        this.lostQty = 0;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }
    },
    'change .remain-qty'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).val();
        let prepaidOrderId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.prepaidOrderId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let prepaidOrderIdExist = _.find(tmpCollection, function (o) {
                        return o.prepaidOrderId == prepaidOrderId;
                    });
                    if (prepaidOrderIdExist) {
                        insertPrepaidOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            prepaidOrderItem: prepaidOrderIdExist,
                            prepaidOrderId: prepaidOrderId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same prepaidOrderId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result) => {
                        this.prepaidOrderId = prepaidOrderId;
                        this.qty = parseFloat(remainQty);
                        this.exactQty = parseFloat(remainQty);
                        this.lostQty = 0;
                        this.name = result.name;
                        this.amount = this.qty * this.price;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }

    }
});


//insert prepaidOrder order item to itemsCollection
let insertPrepaidOrderItem = ({self, remainQty, prepaidOrderItem, prepaidOrderId}) => {
    Meteor.call('getItem', self.itemId, (err, result) => {
        self.prepaidOrderId = prepaidOrderId;
        self.qty = remainQty;
        self.lostQty = 0;
        self.name = result.name;
        self.amount = self.qty * self.price;
        let getItem = itemsCollection.findOne({itemId: self.itemId});
        if (getItem) {
            if (getItem.qty + remainQty <= self.remainQty) {
                itemsCollection.update(getItem._id, {$inc: {qty: self.qty, amount: self.qty * getItem.price}});
                displaySuccess('Added!')
            } else {
                swal("Retry!", `ចំនួនបញ្ចូលចាស់(${getItem.qty}) នឹងបញ្ចូលថ្មី(${remainQty}) លើសពីចំនួនកម្ម៉ង់ទិញចំនួន ${(self.remainQty)}`, "error");
            }
        } else {
            itemsCollection.insert(self);
            displaySuccess('Added!')
        }
    });
};
function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting Invoices....", showConfirmButton: false
    });
    alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, doc)).maximize();
}


function receiveTypeFn({receiveType, vendor}) {
    let label = '';
    if (receiveType == 'PrepaidOrder') {
        label = 'Prepaid Order';
        FlowRouter.query.set({vendorId: vendor, type: 'activePrepaidOrder'});
        alertify.listPrepaidOrder(fa('', 'Prepaid Order'), renderTemplate(listPrepaidOrder));
    }
    else if (receiveType == 'LendingStock') {
        label = 'Lending Stock';
        FlowRouter.query.set({vendorId: vendor, type: 'activeLendingStock'});
        alertify.listLendingStock(fa('', 'Lending Stock'), renderTemplate(listLendingStock));
    }
    else if (receiveType == 'CompanyExchangeRingPull') {
        label = "Ring Pull";
        FlowRouter.query.set({vendorId: vendor, type: 'activeCompanyExchangeRingPull'});
        alertify.listCompanyExchangeRingPull(fa('', 'Exchange Ring Pull'), renderTemplate(listCompanyExchangeRingPull));

    } else if (receiveType == 'ExchangeGratis') {
        label = "Gratis";
        FlowRouter.query.set({vendorId: vendor, type: 'activeExchangeGratis'});
        alertify.listExchangeGratis(fa('', 'Exchange Gratis'), renderTemplate(listExchangeGratis));

    }
    $('.receive-type-label').text(label);

}