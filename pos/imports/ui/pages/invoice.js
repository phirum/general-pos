import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from 'meteor/alanning:roles';
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
import {Invoices} from '../../api/collections/invoice.js';
import {Order} from '../../api/collections/order';
import {Item} from '../../api/collections/item';
import {customerInvoiceCollection, nullCollection} from '../../api/collections/tmpCollection';
let currentItemsCollection = new Mongo.Collection(null);
// Tabular
import {InvoiceTabular} from '../../../common/tabulars/invoice.js';
import {CheckStockByLocation} from '../../../common/methods/checkStockLocation.js'
// Page
import './invoice.html';
import './info-tab.html';
import './customer.html';
//methods
import {invoiceInfo} from '../../../common/methods/invoice.js'
import {customerInfo} from '../../../common/methods/customer.js';
import {isGroupInvoiceClosed} from '../../../common/methods/invoiceGroup';
//Tracker for customer infomation
Tracker.autorun(function () {
    if (Session.get("getCustomerId")) {
        customerInfo.callPromise({_id: Session.get("getCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            })
            .catch(function (e) {

            });
    }
    if (Session.get('saleOrderItems')) {
        Meteor.subscribe('pos.item', {_id: {$in: Session.get('saleOrderItems')}});
    }
});

// Declare template
let indexTmpl = Template.Pos_invoice,
    actionTmpl = Template.Pos_invoiceAction,
    newTmpl = Template.Pos_invoiceNew,
    editTmpl = Template.Pos_invoiceEdit,
    showTmpl = Template.Pos_invoiceShow,
    listSaleOrder = Template.listSaleOrder;
// Local collection
let itemsCollection = nullCollection;
// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('invoice', {size: 'lg'});
    createNewAlertify('invoiceShow',);
    createNewAlertify('listSaleOrder', {size: 'lg'});
    createNewAlertify('customer');
});
indexTmpl.helpers({
    tabularTable() {
        return InvoiceTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});
indexTmpl.onDestroyed(function () {
    customerInvoiceCollection.remove({});
});
indexTmpl.events({
    'click .js-create'(event, instance) {
        alertify.invoice(fa('cart-arrow-down', TAPi18n.__('pos.invoice.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update'(event, instance) {
        let data = this;
        Meteor.call('isInvoiceHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    let msg = '';
                    if (data.invoiceType == 'group') {
                        msg = `Please Check Group #${data.paymentGroupId}`;
                    }
                    swal(
                        'Cancelled',
                        `Data has been used. Can't remove. ${msg}`,
                        'error'
                    );

                } else {
                    excuteEditForm(data);
                }
            }


        });

    },
    'click .js-destroy'(event, instance) {
        let data = this;
        Meteor.call('isInvoiceHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    let msg = '';
                    if (data.invoiceType == 'group') {
                        msg = `Please Check Group #${data.paymentGroupId}`;
                    }
                    swal(
                        'Cancelled',
                        `Data has been used. Can't remove. ${msg}`,
                        'error'
                    );

                } else {
                    destroyAction(
                        Invoices,
                        {_id: data._id},
                        {title: TAPi18n.__('pos.invoice.title'), itemTitle: data._id}
                    );
                }
            }


        });
    },
    'click .js-display'(event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting Invoices....", showConfirmButton: false
        });
        this.customer = _.capitalize(this._customer.name);
        Meteor.call('invoiceShowItems', {doc: this}, function (err, result) {
            swal.close();
            alertify.invoiceShow(fa('eye', TAPi18n.__('pos.invoice.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-invoice'(event, instance) {
        let params = {};
        let queryParams = {invoiceId: this._id};
        let path = FlowRouter.path("pos.invoiceReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.onCreated(function () {
    this.totalDiscount = new ReactiveVar();
    this.isEnoughStock = new ReactiveVar();
    Meteor.subscribe('pos.requirePassword', {branchId: {$in: [Session.get('currentBranch')]}});//subscribe require password validation
    this.repOptions = new ReactiveVar();
    this.itemList = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    Meteor.call('getItemList', (err, result) => {
        this.itemList.set(result);
    });
});
newTmpl.events({
    'click #btn-pay-print'(){
        let val = $('[name="paid"]').val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let paid = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || paid <= 0) {
            alertify.warning('please input paid amount');
            return false;
        }
    },
    'click #btn-pay'(){
        let val = $('[name="paid"]').val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let paid = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || paid <= 0) {
            alertify.warning('please input paid amount');
            return false;
        }
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
    'change .item-qty'(event, instance){
        let val = $(event.currentTarget).val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let self = this;
        let firstQuantity = self.qty;
        self.imei = self.imei ? self.imei : [];
        let currentQty = parseInt($(event.currentTarget).val() == "" ? 0 : $(event.currentTarget).val());
        if (!numericReg.test(val) || currentQty <= 0) {
            $(event.currentTarget).val(firstQuantity);
            $(event.currentTarget).focus().select();
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
    'keydown #item-barcode'(event, instance){
        let charCode = event.which;
        if (event.keyCode == 13) {
            let isWholesale = $('[name="isWholesale"]').is(':checked');
            let barcode = $(event.currentTarget).val();
            if (barcode == "") {
                $('#item-barcode').val('').focus();
                alertify.warning('Please input Barcode.');
                return false;
            }
            let qty = $('#item-qty').val();
            qty = qty == '' ? 1 : parseInt(qty);
            let stockLocationId = $('[name="stockLocationId"]').val();
            if (stockLocationId == "") {
                $('#item-barcode').val('').focus();
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

                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);

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

                                }
                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);

                            }
                        } else {
                            alertify.warning("Can't item by this barcode. '" + barcode + "'");
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
        let isWholesale = $('[name="isWholesale"]').is(':checked');
        let itemId = $(event.currentTarget).val();
        if (itemId == "") {
            alertify.warning('Please choose item.');
            return;
        }
        let qty = $('#item-qty').val();
        qty = qty == '' ? 1 : parseInt(qty);
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (stockLocationId == "") {
            alertify.warning("Please choose stock location.");
            return;
        }
        Meteor.call('addScheme', itemId, "id", function (err, result) {
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
                            let price = isWholesale ? itemResult.isWholesale : itemResult.price;
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
                        }
                        else {
                            alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                        }
                        // }
                    });
                });
            }
            else {
                Meteor.call('findItem', itemId, "id", function (error, itemResult) {
                    debugger;
                    let price = isWholesale ? itemResult.wholesalePrice : itemResult.price;
                    let itemOfCollectionNull = itemsCollection.find({
                        itemId: itemId
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
                            itemId: itemId
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
                        }
                        else {
                            amount = math.round(qty * price, 2);
                            itemsCollection.insert({
                                itemId: itemId,
                                unit: itemResult.unitDoc.name,
                                qty: qty,
                                price: price,
                                amount: amount,
                                name: itemResult.name,
                                discount: 0,
                                imei: []
                            });
                        }
                    }
                    else {
                        alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                    }

                });
            }
        });
        $('#item-id').val('');
        $('[name="paid"]').val(0);

    },
    'change [name="stockLocationId"]'(event, instance){
        debugger;
        let stockLocationId = $(event.currentTarget).val();

        let items = itemsCollection.find().fetch();
        if (items && items.length > 0) {
            Meteor.call('checkStockByLocation', stockLocationId, items, function (error, result) {
                if (!result.isEnoughStock) {
                    itemsCollection.remove({});
                    alertify.warning(result.message);
                }
            });
        }

    },
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.invoice().close();
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
    'change .enable-sale-order'(event, instance){
        itemsCollection.remove({});
        let customerId = $('[name="customerId"]').val();
        if ($(event.currentTarget).prop('checked')) {
            if (customerId != '') {
                FlowRouter.query.set('customerId', customerId);
                $('.sale-order').addClass('toggle-list');
                setTimeout(function () {
                    alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
                }, 700)
            } else {
                displayError('Please select customer');
                $(event.currentTarget).prop('checked', false);
            }

        } else {
            FlowRouter.query.unset();
            $('.sale-order').removeClass('toggle-list');
        }
    },
    'click .toggle-list'(event, instance){
        alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
    },
    'change [name="termId"]'(event, instance){
        let {customerInfo} = Session.get('customerInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            customerInfo._term.netDueIn = result.netDueIn;
            Session.set('customerInfo', customerInfo);
        });
    },
    'click .item-remove'(event, instance){
        itemsCollection.remove(this._id);
    },
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
                        itemsCollection.update(itemId, {$set: {imei: imeis}});
                    }
                    else {
                        alertify.warning('Can not find this IMEI: ' + imei);
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
    'change [name="isWholesale"]'(event) {
        debugger;
        let isWholesale = $('[name="isWholesale"]').is(':checked');
        let itemList = itemsCollection.find({}).fetch();
        let ids = itemList.map(function (id) {
            return id.itemId;
        });
        Meteor.call('findItems', ids, function (er, itemsResult) {
            if (itemsResult) {
                itemList.forEach(function (item) {
                    let itemResult = itemsResult.find(x => x._id == item.itemId);
                    let price = isWholesale ? itemResult.wholesalePrice : itemResult.price;
                    let amount = price * item.qty;
                    amount = math.round(amount * (1 - item.discount / 100), 2);
                    itemsCollection.update(item._id, {$set: {price: price, amount: amount}});
                })
            }
        });
    },
    'change [name="discount"]'(event, instance){
        let discount = event.currentTarget.value;
        instance.totalDiscount.set(discount);
    },
    'click [name="paid"]'(event, instance){
        let total = $('[name="total"]').val();
        $(event.currentTarget).val(total).select();
    },
    'click #btn-save-print'(event, instance){
        FlowRouter.query.set({p: 'true'});
    },
    'click #btn-pay-print'(event, instance){
        FlowRouter.query.set({qp: 'true'});
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
    repId() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                return customerInfo.repId;
            }
        } catch (e) {

        }
        return '';
    },
    termId() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                return customerInfo.termId;
            }
        } catch (e) {

        }
        return '';
    },
    options() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
        }
        return '';
    },
    totalOrder() {
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
        try {
            let {customerInfo, totalAmountDue, whiteListCustomer} = Session.get('customerInfo');
            let allowOverAmountDue = whiteListCustomer ? whiteListCustomer.limitTimes : 'Not set';
            if (!customerInfo) {
                return {empty: true, message: 'No data available'}
            }

            return {
                fields: `<li><i class="fa fa-phone-square"></i> Phone: <b><span class="label label-success">${customerInfo.telephone ? customerInfo.telephone : ''}</span></b> | </li>
              <!--<li>Opening Balance: <span class="label label-success">0</span></li>-->
              <li><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span> | </li>
              <li><i class="fa fa-money"></i> Balance: <span class="label label-primary">${numeral(totalAmountDue).format('0,0.00')}</span> | 
              <li><i class="fa fa-flag"></i> Allow over amount due: <b class="label label-danger">${allowOverAmountDue}</b> | 
              <li><i class="fa fa-home"></i> Address: <b>${customerInfo.address ? customerInfo.address : 'None'}</b>`
            };
        } catch (e) {
        }
    },
    collection() {
        return Invoices;
    },
    itemsCollection() {
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    },
    dueDate() {
        try {
            let date = AutoForm.getFieldValue('invoiceDate');
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    let term = customerInfo._term;
                    let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                    return dueDate;
                }
            }
            return date;
        } catch (e) {
        }
    },
    isTerm() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    return true;
                }
                return false;
            }
        } catch (e) {
        }
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
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('saleOrderItems', undefined);
    Session.set('totalOrder', undefined);
    Session.set('creditLimitAmount', undefined);
    //deletedItem.remove({});
});
// Edit
editTmpl.onCreated(function () {

    Session.set('getCustomerId', this.data.customerId);
    /*  Meteor.subscribe('pos.requirePassword', {branchId: {$in: [Session.get('currentBranch')]}});//subscribe require password validation
     this.repOptions = new ReactiveVar();
     this.isSaleOrder = new ReactiveVar(false);
     this.invoiceDate = new ReactiveVar(this.data.invoiceDate);
     dateState.set(this.data.invoiceDate);
     Meteor.call('getRepList', (err, result) => {
     this.repOptions.set(result);
     });
     if (this.data.invoiceType == 'saleOrder') {
     FlowRouter.query.set('customerId', this.data.customerId);
     this.isSaleOrder.set(true);
     }*/

    this.totalDiscount = new ReactiveVar();
    this.isEnoughStock = new ReactiveVar();
    Meteor.subscribe('pos.requirePassword', {branchId: {$in: [Session.get('currentBranch')]}});//subscribe require password validation
    this.repOptions = new ReactiveVar();
    this.itemList = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    Meteor.call('getItemList', (err, result) => {
        this.itemList.set(result);
    });
});
editTmpl.events({
    'click #btn-pay-print'(){
        let val = $('[name="paid"]').val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let paid = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || paid <= 0) {
            alertify.warning('please input paid amount');
            return false;
        }
    },
    'click #btn-pay'(){
        let val = $('[name="paid"]').val();
        let numericReg = /^\d*[0-9](|.\d*[0-9]|,\d*[0-9])?$/;
        let paid = parseFloat(val == "" ? 0 : val);
        if (!numericReg.test(val) || paid <= 0) {
            alertify.warning('please input paid amount');
            return false;
        }
    },
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
    'keyup #item-barcode'(event, instance){
        let charCode = event.which;
        if (event.keyCode == 13) {
            Meteor.setTimeout(function () {
                let isWholesale = $('[name="isWholesale"]').is(':checked');
                let barcode = $(event.currentTarget).val();
                if (barcode == "") {
                    alertify.warning('Please input Barcode.');
                    return;
                }
                let qty = $('#item-qty').val();
                qty = qty == '' ? 1 : parseInt(qty);
                let stockLocationId = $('[name="stockLocationId"]').val();
                if (stockLocationId == "") {
                    alertify.warning("Please choose stock location.");
                    return;
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
                                }
                                else {
                                    alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
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
                                    }
                                }
                                else {
                                    alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                                }
                            } else {
                                alertify.warning("Can't item by this barcode. '" + barcode + "'");
                            }


                        });
                    }
                });
                $('#item-barcode').val('').focus();
                $('[name="paid"]').val(0);
            }, 100);
            event.preventDefault();
            return false;
        } else {
            event.preventDefault();
            return false;
        }

    },
    'change #item-id'(event, instance){
        let isWholesale = $('[name="isWholesale"]').is(':checked');
        let itemId = $(event.currentTarget).val();
        if (itemId == "") {
            alertify.warning('Please choose item.');
            return;
        }
        let qty = $('#item-qty').val();
        qty = qty == '' ? 1 : parseInt(qty);
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (stockLocationId == "") {
            alertify.warning("Please choose stock location.");
            return;
        }
        Meteor.call('addScheme', itemId, "id", function (err, result) {
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
                            let price = isWholesale ? itemResult.isWholesale : itemResult.price;
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
                        }
                        else {
                            alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                        }
                        // }
                    });
                });
            }
            else {
                Meteor.call('findItem', itemId, "id", function (error, itemResult) {
                    debugger;
                    let price = isWholesale ? itemResult.wholesalePrice : itemResult.price;
                    let itemOfCollectionNull = itemsCollection.find({
                        itemId: itemId
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
                            itemId: itemId
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
                        }
                        else {
                            amount = math.round(qty * price, 2);
                            itemsCollection.insert({
                                itemId: itemId,
                                unit: itemResult.unitDoc.name,
                                qty: qty,
                                price: price,
                                amount: amount,
                                name: itemResult.name,
                                discount: 0,
                                imei: []
                            });
                        }
                    }
                    else {
                        alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                    }

                });
            }
        });
        $('#item-id').val('');
        $('[name="paid"]').val(0);

    },
    'change [name="stockLocationId"]'(event, instance){
        debugger;
        let stockLocationId = $(event.currentTarget).val();

        let items = itemsCollection.find().fetch();
        if (items && items.length > 0) {
            Meteor.call('checkStockByLocation', stockLocationId, items, function (error, result) {
                if (!result.isEnoughStock) {
                    itemsCollection.remove({});
                    alertify.warning(result.message);
                }
            });
        }

    },
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.invoice().close();
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
    'change .enable-sale-order'(event, instance){
        itemsCollection.remove({});
        let customerId = $('[name="customerId"]').val();
        if ($(event.currentTarget).prop('checked')) {
            if (customerId != '') {
                FlowRouter.query.set('customerId', customerId);
                $('.sale-order').addClass('toggle-list');
                setTimeout(function () {
                    alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
                }, 700)
            } else {
                displayError('Please select customer');
                $(event.currentTarget).prop('checked', false);
            }

        } else {
            FlowRouter.query.unset();
            $('.sale-order').removeClass('toggle-list');
        }
    },
    'click .toggle-list'(event, instance){
        alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
    },
    'change [name="termId"]'(event, instance){
        let {customerInfo} = Session.get('customerInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            customerInfo._term.netDueIn = result.netDueIn;
            Session.set('customerInfo', customerInfo);
        });
    },
    'click .item-remove'(event, instance){
        itemsCollection.remove(this._id);
    },
    'click .item-imei'(event, instance){
        let itemId = Session.set('itemIdForImei', this._id);
        $('#input-imei').val('');
        $('#imei').modal('show');
    },
    'keyup #input-imei'(event, instance){
        if (event.which == 13) {
            debugger;
            let branchId = Session.get('currentBranch');
            let imeis = [];
            let imei = $(event.currentTarget).val().trim();
            if (imei == "") {
                return;
            }
            let itemId = Session.get('itemIdForImei');
            let item = itemsCollection.findOne(itemId);
            if (item && item.imei) {
                if (item.imei.indexOf(imei) > -1) {
                    alertify.warning('IMEI already added.');
                    return;
                } else if (item.imei.length >= item.qty) {
                    alertify.warning("Number of IMEI can't greater than Quantity.");
                    return;
                } else {
                    imeis = item.imei;
                    imeis.push(imei);
                }
            } else {
                imeis.push(imei);
            }
            itemsCollection.update(itemId, {$set: {imei: imeis}});
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
    'change [name="isWholesale"]'(event) {
        debugger;
        let isWholesale = $('[name="isWholesale"]').is(':checked');
        let itemList = itemsCollection.find({}).fetch();
        let ids = itemList.map(function (id) {
            return id.itemId;
        });
        Meteor.call('findItems', ids, function (er, itemsResult) {
            if (itemsResult) {
                itemList.forEach(function (item) {
                    let itemResult = itemsResult.find(x => x._id == item.itemId);
                    let price = isWholesale ? itemResult.wholesalePrice : itemResult.price;
                    let amount = price * item.qty;
                    amount = math.round(amount * (1 - item.discount / 100), 2);
                    itemsCollection.update(item._id, {$set: {price: price, amount: amount}});
                })
            }
        });
    },
    'change [name="discount"]'(event, instance){
        let discount = event.currentTarget.value;
        instance.totalDiscount.set(discount);
    },
    'click [name="paid"]'(event, instance){
        let total = $('[name="total"]').val();
        $(event.currentTarget).val(total).select();
    }
});
editTmpl.helpers({
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
    repId() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                return customerInfo.repId;
            }
        } catch (e) {

        }
        return '';
    },
    termId() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                return customerInfo.termId;
            }
        } catch (e) {

        }
        return '';
    },
    options() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
        }
        return '';
    },
    totalOrder() {
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
        try {
            let {customerInfo, totalAmountDue, whiteListCustomer} = Session.get('customerInfo');
            let allowOverAmountDue = whiteListCustomer ? whiteListCustomer.limitTimes : 'Not set';
            if (!customerInfo) {
                return {empty: true, message: 'No data available'}
            }

            return {
                fields: `<li><i class="fa fa-phone-square"></i> Phone: <b><span class="label label-success">${customerInfo.telephone ? customerInfo.telephone : ''}</span></b> | </li>
              <!--<li>Opening Balance: <span class="label label-success">0</span></li>-->
              <li><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span> | </li>
              <li><i class="fa fa-money"></i> Balance: <span class="label label-primary">${numeral(totalAmountDue).format('0,0.00')}</span> | 
              <li><i class="fa fa-flag"></i> Allow over amount due: <b class="label label-danger">${allowOverAmountDue}</b> | 
              <li><i class="fa fa-home"></i> Address: <b>${customerInfo.address ? customerInfo.address : 'None'}</b>`
            };
        } catch (e) {
        }
    },
    collection() {
        return Invoices;
    },
    itemsCollection() {
        return itemsCollection;
    },
    dueDate() {
        try {
            let date = AutoForm.getFieldValue('invoiceDate');
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    let term = customerInfo._term;
                    let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                    return dueDate;
                }
            }
            return date;
        } catch (e) {
        }
    },
    isTerm() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    return true;
                }
                return false;
            }
        } catch (e) {
        }
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
    },
    closeSwal() {
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    isSaleOrder() {
        return Template.instance().isSaleOrder.get();
    },
    collection() {
        return Invoices;
    },
    data() {
        let data = this;
        // Add items to local collection
        _.forEach(data.items, (value) => {
            Meteor.call('getItem', value.itemId, (err, result) => {
                value.name = result.name;
                value.saleId = this.saleId;
                itemsCollection.insert(value);
                currentItemsCollection.insert(value);
            })
        });
        return data;
    },
    itemsCollection() {
        return itemsCollection;
    },
    currentItemsCollection(){
        return currentItemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    },
    repId() {
        let {customerInfo} = Session.get('customerInfo');
        if (customerInfo) {
            try {
                return customerInfo.repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId() {
        let {customerInfo} = Session.get('customerInfo');
        if (customerInfo) {
            try {
                return customerInfo.termId;
            } catch (e) {

            }
        }
        return '';
    },
    options() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
        }
        return '';
    },
    totalOrder() {
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
        try {
            let {customerInfo, totalAmountDue, whiteListCustomer} = Session.get('customerInfo');
            let allowOverAmountDue = whiteListCustomer ? whiteListCustomer.limitTimes : 'Not set';
            if (!customerInfo) {
                return {empty: true, message: 'No data available'}
            }

            return {
                fields: `<li><i class="fa fa-phone-square"></i> Phone: <b><span class="label label-success">${customerInfo.telephone ? customerInfo.telephone : ''}</span></b> | </li>
              <!--<li>Opening Balance: <span class="label label-success">0</span></li>-->
              <li><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span> | </li>
              <li><i class="fa fa-money"></i> Balance: <span class="label label-primary">${numeral(totalAmountDue).format('0,0.00')}</span> | 
              <li><i class="fa fa-flag"></i> Allow over amount due: <b class="label label-danger">${allowOverAmountDue}</b> | 
              <li><i class="fa fa-home"></i> Address: <b>${customerInfo.address ? customerInfo.address : 'None'}</b>`
            };
        } catch (e) {
        }
    },
    repId() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                return customerInfo.repId;
            }
        } catch (e) {
        }
    },
    collection() {
        return Invoices;
    },
    itemsCollection() {
        return itemsCollection;
    },
    dueDate() {
        try {
            let date = AutoForm.getFieldValue('invoiceDate');
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    let term = customerInfo._term;

                    let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                    return dueDate;
                }
            }
            return date;
        } catch (e) {
        }
    },
    isTerm() {
        try {
            let {customerInfo} = Session.get('customerInfo');
            if (customerInfo) {
                if (customerInfo._term) {
                    return true;
                }
                return false;
            }
        } catch (e) {
        }
    }
});
editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('saleOrderItems', undefined);
    Session.set('totalOrder', undefined);
    // deletedItem.remove({});
});
// Show
/*showTmpl.onCreated(function () {
 this.invoice = new ReactiveVar();
 this.autorun(() => {
 invoiceInfo.callPromise({_id: this.data._id})
 .then((result) => {
 this.invoice.set(result);
 }).catch(function (err) {
 }
 );
 });
 });
 showTmpl.helpers({
 company(){
 let doc = Session.get('currentUserStockAndAccountMappingDoc');
 return doc.company;
 },
 i18nLabel(label) {
 let key = `pos.invoice.schema.${label}.label`;
 return TAPi18n.__(key);
 },
 colorizeType(type) {
 if (type == 'term') {
 return `<label class="label label-info">T</label>`
 }
 return `<label class="label label-success">G</label>`
 },
 colorizeStatus(status) {
 if (status == 'active') {
 return `<label class="label label-info">A</label>`
 } else if (status == 'partial') {
 return `<label class="label label-danger">P</label>`
 }
 return `<label class="label label-success">C</label>`
 }
 });
 showTmpl.events({
 'click .print-invoice-show'(event, instance) {
 $('#to-print').printThis();
 }
 });*/
//listSaleOrder
/*listSaleOrder.helpers({
 saleOrders() {
 let item = [];
 let saleOrders = Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')}).fetch();
 if (deletedItem.find().count() > 0) {
 deletedItem.find().forEach(function (item) {
 saleOrders.forEach(function (saleOrder) {
 saleOrder.items.forEach(function (saleItem) {
 if (saleItem.itemId == item.itemId) {
 saleItem.remainQty += item.qty;
 saleOrder.sumRemainQty += item.qty;
 }
 });
 });
 });
 }
 saleOrders.forEach(function (saleOrder) {
 saleOrder.items.forEach(function (saleItem) {
 item.push(saleItem.itemId);
 });
 });
 Session.set('saleOrderItems', item);
 return saleOrders;
 },
 hasSaleOrders() {
 let count = Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')}).count();
 return count > 0;
 },
 getItemName(itemId) {
 try {
 return Item.findOne(itemId).name;
 } catch (e) {

 }

 }
 });
 listSaleOrder.events({
 'click .add-item'(event, instance) {
 event.preventDefault();
 let remainQty = $(event.currentTarget).parents('.sale-item-parents').find('.remain-qty').val();
 let saleId = $(event.currentTarget).parents('.sale-item-parents').find('.saleId').text().trim()
 let tmpCollection = itemsCollection.find().fetch();
 if (remainQty != '' && remainQty != '0') {
 if (this.remainQty > 0) {
 if (tmpCollection.length > 0) {
 let saleIdExist = _.find(tmpCollection, function (o) {
 return o.saleId == saleId;
 });
 if (saleIdExist) {
 insertSaleOrderItem({
 self: this,
 remainQty: parseFloat(remainQty),
 saleItem: saleIdExist,
 saleId: saleId
 });
 } else {
 swal("Retry!", "Item Must be in the same saleId", "warning")
 }
 } else {
 Meteor.call('getItem', this.itemId, (err, result) => {
 this.saleId = saleId;
 this.qty = parseFloat(remainQty)
 this.name = result.name;
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
 'change .remain-qty'(event, instance) {
 event.preventDefault();
 let remainQty = $(event.currentTarget).val();
 let saleId = $(event.currentTarget).parents('.sale-item-parents').find('.saleId').text().trim()
 let tmpCollection = itemsCollection.find().fetch();
 if (remainQty != '' && remainQty != '0') {
 if (this.remainQty > 0) {
 if (parseFloat(remainQty) > this.remainQty) {
 remainQty = this.remainQty;
 $(event.currentTarget).val(this.remainQty);
 }
 if (tmpCollection.length > 0) {
 let saleIdExist = _.find(tmpCollection, function (o) {
 return o.saleId == saleId;
 });
 if (saleIdExist) {
 insertSaleOrderItem({
 self: this,
 remainQty: parseFloat(remainQty),
 saleItem: saleIdExist,
 saleId: saleId
 });
 } else {
 swal("Retry!", "Item Must be in the same saleId", "warning")
 }
 } else {
 Meteor.call('getItem', this.itemId, (err, result) => {
 this.saleId = saleId;
 this.qty = parseFloat(remainQty);
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
 });*/
//insert sale order item to itemsCollection
let insertSaleOrderItem = ({self, remainQty, saleItem, saleId}) => {
    Meteor.call('getItem', self.itemId, (err, result) => {
        self.saleId = saleId;
        self.qty = remainQty;
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
    console.log(doc);
    /*swal({
     title: "Pleas Wait",
     text: "Getting Invoices....", showConfirmButton: false
     });*/
    alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, doc)).maximize();
}
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];

            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                if (obj.saleId) {
                    doc.saleId = obj.saleId;
                }
                items.push(obj);
            });
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
    onSuccess(formType, id) {


        let print = FlowRouter.query.get('p');
        //let qp = FlowRouter.query.get('qp'); //trigger quick payment
        if (print == 'true') {
            alertify.invoice().close();
            FlowRouter.go('/pos/print-invoice?inv=' + id);
        }

        //get invoiceId, total, customerId
        if (formType != 'update') {
            if (!FlowRouter.query.get('customerId')) {
                Meteor.call('getInvoiceId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.invoice().close();
            }
        } else {
            alertify.invoice().close();
        }


        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        deletedItem.remove({});
        Session.set('customerInfo', undefined);
        Session.set("getCustomerId", undefined);
        // }
        displaySuccess();
    },
    onError(formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_invoiceNew',
    'Pos_invoiceUpdate'
], hooksObject);


let server = "http://localhost:3000/";
let callMethod = function (methodName, data, callback) {
    $.ajax(server + methodName, {
        method: "post",
        data: JSON.stringify(data),
        contentType: "application/json",
        success: function (data) {
            callback(null, data);
        },
        error: function (data) {
            callback(data.responseJSON);
        }
    });
};

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