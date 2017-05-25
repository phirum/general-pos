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
import {Setting} from '../../../../core/imports/api/collections/setting.js';
import {Currency} from '../../../../core/imports/api/collections/currency.js';
import {EnterBills} from '../../api/collections/enterBill.js';
import {Item} from '../../api/collections/item';
import {vendorBillCollection} from '../../api/collections/tmpCollection';
// Tabular
import {EnterBillTabular} from '../../../common/tabulars/enterBill.js';

// Page
import './enterBill.html';
import './enterBill-items.js';
import './info-tab.html';
import './vendor.html'
//methods
import {EnterBillInfo} from '../../../common/methods/enterBill.js'
import {vendorInfo} from '../../../common/methods/vendor.js';

//Tracker for vendor infomation
Tracker.autorun(function () {
    if (Session.get("getVendorId")) {
        vendorInfo.callPromise({_id: Session.get("getVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
});
// Declare template
let indexTmpl = Template.Pos_enterBill,
    actionTmpl = Template.Pos_enterBillAction,
    newTmpl = Template.Pos_enterBillNew,
    editTmpl = Template.Pos_enterBillEdit,
    showTmpl = Template.Pos_enterBillShow;
// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
Tracker.autorun(function () {
    if (Session.get('vendorId')) {
        vendorInfo.callPromise({_id: Session.get('vendorId')})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
});

indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('enterBill', {size: 'lg'});
    createNewAlertify('enterBillShow', {size: 'lg'});
    createNewAlertify('vendor');
});

indexTmpl.helpers({
    tabularTable(){
        return EnterBillTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.enterBill(fa('plus', TAPi18n.__('pos.enterBill.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        let data = this;
        Meteor.call('isBillHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    let msg = '';
                    if (data.billType == 'group') {
                        msg = `Please Check Group #${data.paymentGroupId}`;
                    }
                    swal(
                        'Cancelled',
                        `Data has been used. Can't remove. ${msg}`,
                        'error'
                    );

                } else {
                    alertify.enterBill(fa('pencil', TAPi18n.__('pos.enterBill.title')), renderTemplate(editTmpl, data));
                }
            }
        });

    },
    'click .js-destroy' (event, instance) {
        let data = this;
        Meteor.call('isBillHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    let msg = '';
                    if (data.billType == 'group') {
                        msg = `Please Check Group #${data.paymentGroupId}`;
                    }
                    swal(
                        'Cancelled',
                        `Data has been used. Can't remove. ${msg}`,
                        'error'
                    );

                } else {
                    destroyAction(
                        EnterBills,
                        {_id: data._id},
                        {title: TAPi18n.__('pos.enterBill.title'), itemTitle: data._id}
                    );
                }
            }
        });
    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting Invoices....", showConfirmButton: false
        });
        // this.customer = vendorBillCollection.findOne(this.vendorId).name;
        Meteor.call('billShowItems', {doc: this}, function (err, result) {
            swal.close();
            alertify.enterBillShow(fa('eye', TAPi18n.__('pos.invoice.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-enterBill' (event, instance) {
        let params = {};
        let queryParams = {enterBillId: this._id};
        let path = FlowRouter.path("pos.enterBillReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});
indexTmpl.onDestroyed(function () {
    vendorBillCollection.remove({});
});
newTmpl.onCreated(function () {
    /* this.repOptions = new ReactiveVar();
     Meteor.call('getRepList', (err, result) => {
     this.repOptions.set(result);
     });
     */

    this.totalDiscount = new ReactiveVar();
    this.isEnoughStock = new ReactiveVar();
    Meteor.subscribe('pos.requirePassword', {branchId: {$in: [Session.get('currentBranch')]}});//subscribe require password validation
    this.repOptions = new ReactiveVar();
    this.itemList = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    Meteor.call('getItemList', {itemType: 'stock', scheme: {$exists: false}}, (err, result) => {
        this.itemList.set(result);
    });
});
// New
newTmpl.events({
    'click .item-imei'(event, instance){
        let itemId = Session.set('itemIdForImei', this._id);
        $('#input-imei').val('');
        $('#imei').modal('show');
    },
    'keydown #input-imei'(event, instance){
        if (event.which == 13) {
            let stockLocationId = $('[name="stockLocationId"]').val();
            let branchId = Session.get('currentBranch');
            let imeis = [];
            let imei = $(event.currentTarget).val().trim();
            if (imei == "") {
                $(event.currentTarget).val('').focus();
                return;
            }
            let itemId = Session.get('itemIdForImei');
            let item = itemsCollection.findOne(itemId);
            if (item && item.imei) {
                if (item.imei.indexOf(imei) > -1) {
                    alertify.warning('IMEI already added.');
                    $(event.currentTarget).val('').focus();
                    return;
                } else if (item.imei.length >= item.qty) {
                    alertify.warning("Number of IMEI can't greater than Quantity.");
                    $(event.currentTarget).val('').focus();
                    return;
                } else {
                    imeis = item.imei;
                    imeis.push(imei);
                }
            } else {
                imeis.push(imei);
            }

            Meteor.call('findItem', item.itemId, "id", function (error, itemResult) {
                debugger;
                if (itemResult) {
                    if (itemResult.imei && itemResult.imei[stockLocationId].indexOf(imei) != -1) {
                        alertify.warning('IMEI is already exist: ' + imei);
                    }
                    else {
                        itemsCollection.update(itemId, {$set: {imei: imeis}});
                    }
                } else {
                    alertify.error(error.message);
                }
            });
            $(event.currentTarget).val('').focus();

        }
    },
    'click .btn-remove-imei'(event) {
        let itemId = Session.get('itemIdForImei');
        //let thisBtn = $(e.currentTarget);
        // let imei = thisBtn.parents('tr').find('.td-imei').text().trim();
        let imei = this.code;
        let item = itemsCollection.findOne(itemId);
        let obj = {};
        obj.imei = subtractArray(item.imei, [imei]);
        itemsCollection.update(itemId, {$set: obj});
    },
    'change .item-price'(event, instance){
        // let item = itemsCollection.findOne(this._id);
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstPrice = this.price;
        let price = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || price <= 0) {
            $(event.currentTarget).val(firstPrice);
            $(event.currentTarget).focus().select();
            return;
        }
        let set = {};
        set.price = price;
        set.amount = (price * this.qty) * (1 - this.discount / 100);
        itemsCollection.update(this._id, {$set: set});
        $('[name="paid"]').val(0);
    },
    'change .item-discount'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstDiscount = this.discount;
        let discount = parseFloat($(event.currentTarget).val());
        if (!numericReg.test(val) || discount < 0 || discount > 100 || $(event.currentTarget).val() == "") {
            $(event.currentTarget).val(firstDiscount);
            $(event.currentTarget).focus().select();
            return;
        }
        let selector = {};
        selector.discount = discount;
        selector.amount = (this.price * this.qty) * (1 - discount / 100);
        itemsCollection.update(this._id, {$set: selector});
        $('[name="paid"]').val(0);
    },
    'keydown .item-qty,.item-price,.item-discount'(event, instance){
        if (event.which == 13) {
            $(event.currentTarget).trigger('change');
        }
    },
    'change .item-qty'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstDiscount = this.qty;
        let qty = parseFloat($(event.currentTarget).val());
        if (!numericReg.test(val) || $(event.currentTarget).val() == "" || qty <= 0) {
            $(event.currentTarget).val(firstDiscount);
            $(event.currentTarget).focus().select();
            return;
        }
        let selector = {};
        selector.qty = qty;
        selector.amount = (this.price * qty) * (1 - this.discount / 100);
        itemsCollection.update(this._id, {$set: selector});
        $('[name="paid"]').val(0);
    },
    'change .item-discount'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstDiscount = this.discount;
        let discount = parseFloat($(event.currentTarget).val());
        if (!numericReg.test(val) || discount < 0 || discount > 100 || $(event.currentTarget).val() == "") {
            $(event.currentTarget).val(firstDiscount);
            $(event.currentTarget).focus();
            return;
        }
        let selector = {};
        selector.discount = discount;
        selector.amount = (this.price * this.qty) * (1 - discount / 100);
        itemsCollection.update(this._id, {$set: selector});
        $('[name="paid"]').val(0);
    },

    'keydown #item-barcode'(event, instance){
        let charCode = event.which;
        if (event.keyCode == 13) {

            debugger;
            let itemId = $(event.currentTarget).val();
            if (itemId == "") {
                sAlert.warning("Please input Barcode");
                $('#item-barcode').val('').focus();
                $('[name="paid"]').val(0);
                return false;
            }

            let qty = $('#item-qty').val();
            qty = qty == '' ? 1 : parseInt(qty);
            // Check exist
            let exist = itemsCollection.findOne({
                itemId: itemId
            });
            let amount = 0;
            if (exist) {
                qty += parseInt(exist.qty);
                amount = math.round(qty * exist.price, 2);
                itemsCollection.update({
                    _id: exist._id
                }, {
                    $set: {
                        qty: qty,
                        //price: exist.price,
                        amount: amount
                    }
                });
            } else {
                Meteor.call('findItem', itemId, "barcode", function (error, itemResult) {
                    if (itemResult) {
                        amount = math.round(qty * itemResult.purchasePrice, 2);
                        itemsCollection.insert({
                            itemId: itemId,
                            unit: itemResult.unitDoc.name,
                            qty: qty,
                            price: itemResult.purchasePrice,
                            amount: amount,
                            name: itemResult.name,
                            discount: 0,
                            imei: []
                        });
                    } else {
                        alertify.warning('Can not find Item');
                    }
                });
            }
            $('#item-barcode').val('').focus();
            $('[name="paid"]').val(0);
            return false;
        }
    },
    'change #item-id'(event, instance){
        debugger;
        let itemId = $(event.currentTarget).val();
        if (itemId == "") {
            sAlert.warning("Please select Item");
            return;
        }
        let qty = $('#item-qty').val();
        qty = qty == '' ? 1 : parseInt(qty);
        // Check exist
        let exist = itemsCollection.findOne({
            itemId: itemId
        });
        let amount = 0;
        if (exist) {
            qty += parseInt(exist.qty);
            amount = math.round(qty * exist.price, 2);
            itemsCollection.update({
                _id: exist._id
            }, {
                $set: {
                    qty: qty,
                    //price: exist.price,
                    amount: amount
                }
            });
        } else {
            Meteor.call('findItem', itemId, "id", function (error, itemResult) {
                if (itemResult) {
                    amount = math.round(qty * itemResult.purchasePrice, 2);
                    itemsCollection.insert({
                        itemId: itemId,
                        unit: itemResult.unitDoc.name,
                        qty: qty,
                        price: itemResult.purchasePrice,
                        amount: amount,
                        name: itemResult.name,
                        discount: 0,
                        imei: []
                    });
                } else {
                    alertify.warning('Can not find Item');
                }
            });
        }
        $('#item-id').val('');
        $('[name="paid"]').val(0);

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
    'click .go-to-pay-bill'(event, instance){
        alertify.enterBill().close();
    }
});
newTmpl.helpers({
    baseCurrency(){
        debugger;
        let setting = Setting.findOne();
        if (setting) {
            return Currency.findOne(setting.baseCurrency);
        }
        return {};
    },
    stockLocation() {
        try {
            let stockLocationAndAccountMapping = Session.get('currentUserStockAndAccountMappingDoc');
            if (stockLocationAndAccountMapping) {
                if (stockLocationAndAccountMapping.stockLocations.length > 0) {
                    return stockLocationAndAccountMapping.stockLocations[0];
                }
            }
            return false;
        } catch (e) {
        }

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
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    repId(){
        try {
            let {vendorInfo} = Session.get('vendorInfo');
            if (vendorInfo) {
                return vendorInfo.repId;
            }
            return '';
        } catch (e) {

        }
    },
    termId(){
        try {
            let {vendorInfo} = Session.get('vendorInfo');
            if (vendorInfo) {

                return vendorInfo.termId;

            }
            return '';
        } catch (e) {

        }
    },
    totalEnterBill(){
        let total = 0;
        itemsCollection.find().forEach(function (item) {
            total += item.amount;
        });
        return total;
    },
    vendorInfo() {
        try {
            let {vendorInfo, totalAmountDue} = Session.get('vendorInfo');
            if (!vendorInfo) {
                return {empty: true, message: 'No data available'}
            }

            return {
                // <li><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span> | </li>
                fields: `<li><i class="fa fa-phone-square"></i> Phone: <b><span class="label label-success">${vendorInfo.telephone ? vendorInfo.telephone : ''}</span></b> | </li>
              <!--<li>Opening Balance: <span class="label label-success">0</span></li>-->
              <li><i class="fa fa-money"></i> Balance: <span class="label label-primary">${numeral(totalAmountDue).format('0,0.00')}</span> | 
              <li><i class="fa fa-home"></i> Address: <b>${vendorInfo.address ? vendorInfo.address : 'None'}</b>`

            };
        } catch (e) {
        }
    },
    collection(){
        return EnterBills;
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
    isTerm(){
        try {
            let {vendorInfo} = Session.get('vendorInfo');
            if (vendorInfo) {
                if (vendorInfo._term) {
                    return true;
                }
                return false;
            }
        } catch (e) {
        }
    },
    dueDate(){
        try {
            let date = AutoForm.getFieldValue('enterBillDate');
            let {vendorInfo} = Session.get('vendorInfo');
            if (vendorInfo) {
                if (vendorInfo._term) {
                    let term = vendorInfo._term;

                    let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                    console.log(dueDate);
                    return dueDate;
                }
            }
            return date;
        } catch (e) {
        }
    },
    itemsCollection() {
        return itemsCollection;
    },
    itemList(){
        let instance = Template.instance();
        if (instance.itemList.get() && instance.repOptions.get()) {
            return instance.itemList.get();
        }
        return [];
    },
    items(){
        return itemsCollection.find().fetch();
    },
    imeis(){
        let imeis = [];
        let itemId = Session.get('itemIdForImei');
        let item = itemsCollection.findOne(itemId);
        if (item && item.imei) {
            for (let i = 0; i < item.imei.length; i++) {
                imeis.push({order: i + 1, code: item.imei[i]});
            }
        }
        return imeis;
    },
    subTotal: function () {
        let subTotal = 0;
        let getItems = itemsCollection.find({});
        getItems.forEach((obj) => {
            subTotal += obj.amount;
        });
        return math.round(subTotal, 2);
    },
    total: function () {
        let subTotal = 0;
        let instance = Template.instance();
        let discount = instance.totalDiscount.get();
        discount = discount ? discount : 0;
        let getItems = itemsCollection.find({});
        getItems.forEach((obj) => {
            subTotal += obj.amount;
        });
        return math.round(subTotal * (1 - discount / 100), 2);
    },
    totalDiscount: function () {
        let instance = Template.instance();
        let discount = instance.totalDiscount.get();
        return discount ? discount : 0;
    }
});

newTmpl.onDestroyed(function () {
    debugger;
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
    Session.set('getVendorId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
});
// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});
editTmpl.events({
    'change .item-price'(event, instance){
        // let item = itemsCollection.findOne(this._id);
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstPrice = this.price;
        let price = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || price <= 0) {
            $(event.currentTarget).val(firstPrice);
            $(event.currentTarget).focus();
            return;
        }
        let set = {};
        set.price = price;
        set.amount = (price * this.qty) * (1 - this.discount / 100);
        itemsCollection.update(this._id, {$set: set});
        $('[name="paid"]').val(0);
    },
    'change .item-qty'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let self = this;
        let firstQuantity = self.qty;
        self.imei = self.imei ? self.imei : [];
        let currentQty = parseInt($(event.currentTarget).val() == "" ? 0 : $(event.currentTarget).val());
        if (!numericReg.test(val) || currentQty <= 0) {
            $(event.currentTarget).val(firstQuantity);
            $(event.currentTarget).focus();
            return;
        }
        if (self.imei.length > currentQty) {
            alertify.warning("Quantity can't be less than number of IMEI.");
            $(event.currentTarget).val(firstQuantity);
            return;
        }
        debugger;
        let thisObj = $(event.currentTarget);
        let checkQty = 0;
        let itemOfCollectionNull = itemsCollection.find({
            itemId: self.itemId
        });
        if (itemOfCollectionNull.count() > 0) {
            let addedQty = 0;
            itemOfCollectionNull.forEach(function (itemNull) {
                addedQty += itemNull.qty;
            });
            checkQty = addedQty - self.qty + currentQty;
        } else {
            checkQty = currentQty;
        }
        let stockLocationId = $('[name="stockLocationId"]').val();
        Meteor.call('findItem', self.itemId, 'id', function (error, itemResult) {
            let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
            if (checkQty <= inventoryQty) {
                let selector = {};
                selector.qty = currentQty;
                selector.amount = (currentQty * self.price) * (1 - self.discount / 100);
                itemsCollection.update(self._id, {$set: selector});
            }
            else {
                thisObj.val(self.qty);
                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
            }
        });
        /*
         let selector = {};
         if (currentQty != '' || currentQty != 0) {
         selector.$set = {
         amount: currentQty * self.price,
         qty: currentQty
         }
         } else {
         selector.$set = {
         amount: self.qty * self.price,
         qty: self.qty
         };
         currentQty = self.qty;
         thisObj.val(self.qty);
         }

         let invoice = instance.view.parentView.parentView._templateInstance.data;
         if (invoice) {
         let soldQty = 0;
         //-----------------------
         let docItems = [];
         invoice.items.reduce(function (res, value) {
         if (!res[value.itemId]) {
         res[value.itemId] = {
         price: value.price,
         amount: value.amount,
         qty: 0,
         itemId: value.itemId
         };
         docItems.push(res[value.itemId])
         } else {
         res[value.itemId].amount += value.amount;
         }
         res[value.itemId].qty += value.qty;
         return res;
         }, {});
         //-----------------------
         if (stockLocationId == invoice.stockLocationId) {
         soldQty = docItems.find(x => x.itemId == itemId).qty;
         }
         Meteor.call('findItem', itemId, function (error, itemResult) {
         let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
         inventoryQty += soldQty;
         if (checkQty <= inventoryQty) {
         itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
         }
         else {
         selector.$set = {
         amount: currentItem.qty * currentItem.price,
         qty: currentItem.qty
         };
         itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
         thisObj.val(currentItem.qty);
         alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
         }

         });
         }
         else {*/

        /* }*/
        $('[name="paid"]').val(0);
    },
    'change .item-discount'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let firstDiscount = this.discount;
        let discount = parseFloat($(event.currentTarget).val());
        if (!numericReg.test(val) || discount < 0 || discount > 100 || $(event.currentTarget).val() == "") {
            $(event.currentTarget).val(firstDiscount);
            $(event.currentTarget).focus();
            return;
        }
        let selector = {};
        selector.discount = discount;
        selector.amount = (this.price * this.qty) * (1 - discount / 100);
        itemsCollection.update(this._id, {$set: selector});
        $('[name="paid"]').val(0);
    },

    'keydown #item-barcode'(event, instance){
        let charCode = event.which;
        if (event.keyCode == 13) {
            let isWholesale = $('[name="isWholesale"]').is(':checked');
            let barcode = $(event.currentTarget).val();
            if (barcode == "") {
                alertify.warning('Please input Barcode.');
                return false;
            }
            let qty = $('#item-qty').val();
            qty = qty == '' ? 1 : parseInt(qty);
            let stockLocationId = $('[name="stockLocationId"]').val();
            if (stockLocationId == "") {
                alertify.warning("Please choose stock location.");
                return false;
            }
            Meteor.call('addScheme', barcode, "barcode", function (err, result) {
                if (!_.isEmpty(result[0])) {
                    result.forEach(function (item) {
                        Meteor.call('findItem', item.itemId, "id", function (error, itemResult) {
                            let itemOfCollectionNull = itemsCollection.find({
                                itemId: item.itemId
                            });
                            let checkQty = 0;
                            if (itemOfCollectionNull.count() > 0) {
                                let addedQty = 0;
                                itemOfCollectionNull.forEach(function (itemNull) {
                                    addedQty += itemNull.qty;
                                });
                                checkQty = (item.quantity * qty) + addedQty;
                            } else {
                                checkQty = item.quantity * qty;
                            }
                            let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                            if (checkQty <= inventoryQty) {
                                let price = isWholesale ? item.isWholesale : item.price;
                                itemsCollection.insert({
                                    itemId: item.itemId,
                                    unit: itemResult.unitDoc.name,
                                    qty: item.quantity * qty,
                                    price: price,
                                    amount: (price * item.quantity) * qty,
                                    name: itemResult.name,
                                    discount: 0,
                                    imei: []
                                });
                                return false;
                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                                return false;
                            }
                            // }
                        });
                    });
                }
                else {
                    Meteor.call('findItem', barcode, "barcode", function (error, itemResult) {

                        if (itemResult) {
                            debugger;
                            let price = isWholesale ? itemResult.wholesalePrice : itemResult.price;
                            let itemOfCollectionNull = itemsCollection.find({
                                itemId: itemResult._id
                            });
                            let checkQty = 0;
                            if (itemOfCollectionNull.count() > 0) {
                                let addedQty = 0;
                                itemOfCollectionNull.forEach(function (itemNull) {
                                    addedQty += itemNull.qty;
                                });
                                checkQty = qty + addedQty;
                            } else {
                                checkQty = qty;
                            }
                            let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                            let amount = 0;
                            if (checkQty <= inventoryQty) {
                                let exist = itemsCollection.findOne({
                                    itemId: itemResult._id
                                });
                                if (exist) {
                                    qty += parseInt(exist.qty);
                                    amount = qty * price;
                                    amount = math.round(amount * (1 - exist.discount / 100), 2);
                                    itemsCollection.update({
                                        _id: exist._id
                                    }, {
                                        $set: {
                                            qty: qty,
                                            price: price,
                                            amount: amount
                                        }
                                    });
                                    return false;
                                }
                                else {
                                    amount = math.round(qty * price, 2);
                                    itemsCollection.insert({
                                        itemId: itemResult._id,
                                        unit: itemResult.unitDoc.name,
                                        qty: qty,
                                        price: price,
                                        amount: amount,
                                        name: itemResult.name,
                                        discount: 0,
                                        imei: []
                                    });
                                    return false;
                                }
                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                                return false;
                            }
                        } else {
                            alertify.warning("Can't item by this barcode. '" + barcode + "'");
                            return false;
                        }

                    });
                }
            });
            $('#item-barcode').val('').focus();
            $('[name="paid"]').val(0);
            return false;
        }


    },
    'change #item-id'(event, instance){
        debugger;
        let itemId = $(event.currentTarget).val();
        if (itemId == "") {
            sAlert.warning("Please select Item");
            return;
        }
        let qty = $('#item-qty').val();
        qty = qty == '' ? 1 : parseInt(qty);
        // Check exist
        let exist = itemsCollection.findOne({
            itemId: itemId
        });
        let amount = 0;
        if (exist) {
            qty += parseInt(exist.qty);
            amount = math.round(qty * exist.price, 2);
            itemsCollection.update({
                _id: exist._id
            }, {
                $set: {
                    qty: qty,
                    //price: exist.price,
                    amount: amount
                }
            });
        } else {
            Meteor.call('findItem', itemId, "id", function (error, itemResult) {
                amount = math.round(qty * itemResult.purchasePrice, 2);
                if (itemResult) {
                    itemsCollection.insert({
                        itemId: itemId,
                        unit: itemResult.unitDoc.name,
                        qty: qty,
                        price: itemResult.purchasePrice,
                        amount: amount,
                        name: itemResult.name,
                        discount: 0,
                        imei: []
                    });
                } else {
                    alertify.warning('Can not find Item');
                }
            });
        }
        $('#item-id').val('');
        $('[name="paid"]').val(0);

    },

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
    collection(){
        return EnterBills;
    },
    data () {
        let data = this;
        // Add items to local collection
        _.forEach(data.items, (value) => {
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
    },
    repId(){
        let {vendorInfo} = Session.get('vendorInfo');
        if (vendorInfo) {
            try {
                return vendorInfo.repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        let {vendorInfo} = Session.get('vendorInfo');
        if (vendorInfo) {
            try {
                return vendorInfo.termId;
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
        let {vendorInfo} = Session.get('vendorInfo');
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
    dueDate(){
        let date = AutoForm.getFieldValue('enterBillDate');
        let {vendorInfo} = Session.get('vendorInfo');
        if (vendorInfo) {
            if (vendorInfo._term) {
                let term = vendorInfo._term;
                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                return dueDate;
            }
        }
        return date;
    },
    isTerm(){
        let {vendorInfo} = Session.get('vendorInfo');
        if (vendorInfo) {
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
            let items = [];
            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                items.push(obj);
            });
            doc.status = 'active';
            doc.items = items;
            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                items.push(obj);
            });
            doc.$set.items = items;
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
                alertify.enterBill().close();
            }
        } else {
            alertify.enterBill().close();
        }
        // }
        Session.set('getVendorId', undefined);
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_enterBillNew',
    'Pos_enterBillEdit'
], hooksObject);


function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting Invoices....", showConfirmButton: false
    });
    alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, doc)).maximize();
}
function subtractArray(src, filt) {
    let temp = {}, i, result = [];
    // load contents of filt into an object
    // for faster lookup
    for (i = 0; i < filt.length; i++) {
        temp[filt[i]] = true;
    }

    // go through each item in src
    for (i = 0; i < src.length; i++) {
        if (!(src[i] in temp)) {
            result.push(src[i]);
        }
    }
    return (result);
}