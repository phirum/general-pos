import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Roles } from 'meteor/alanning:roles';
import { alertify } from 'meteor/ovcharik:alertifyjs';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { fa } from 'meteor/theara:fa-helpers';
import { lightbox } from 'meteor/theara:lightbox-helpers';
import { _ } from 'meteor/erasaur:meteor-lodash';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { ReactiveTable } from 'meteor/aslagle:reactive-table';
import 'meteor/theara:template-states';

// Lib
import { createNewAlertify } from '../../../../core/client/libs/create-new-alertify.js';
import { renderTemplate } from '../../../../core/client/libs/render-template.js';
import { destroyAction } from '../../../../core/client/libs/destroy-action.js';
import { displaySuccess, displayError } from '../../../../core/client/libs/display-alert.js';
import { reactiveTableSettings } from '../../../../core/client/libs/reactive-table-settings.js';
import { __ } from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import { RingPullItemsSchema } from '../../api/collections/order-items.js';
import { ExchangeRingPulls } from '../../api/collections/exchangeRingPull.js';
import { Order } from '../../api/collections/order';
// Declare template
// Page
import './exchangeRingPull-items.html';
var itemsTmpl = Template.Pos_exchangeRingPullItems,
    actionItemsTmpl = Template.Pos_exchangeRingPullItemsAction,
    editItemsTmpl = Template.Pos_exchangeRingPullItemsEdit;

//methods
import { removeItemInSaleOrder } from '../../../common/methods/sale-order';
// Local collection
var itemsCollection;

export const deletedItem = new Mongo.Collection(null); //export collection deletedItem to exchangeRingPull js
Tracker.autorun(function () {
    if (FlowRouter.query.get('customerId')) {
        let sub = Meteor.subscribe('pos.activeSaleOrder', {
            customerId: FlowRouter.query.get('customerId'),
            status: 'active'
        });
        if (!sub.ready()) {
            swal({
                title: "Pleas Wait",
                text: "Getting Order....", showConfirmButton: false
            });
        } else {
            setTimeout(function () {
                swal.close();
            }, 500);
        }

    }
});
itemsTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('item');

    // Data context
    let data = Template.currentData();
    itemsCollection = data.itemsCollection;


    // State
    this.state('amount', 0);

});

itemsTmpl.onRendered(function () {

});

itemsTmpl.helpers({
    notActivatedSaleOrder() {
        if (FlowRouter.query.get('customerId')) {
            return false;
        }
        return true;
    },
    tableSettings: function () {
        let i18nPrefix = 'pos.exchangeRingPull.schema';

        reactiveTableSettings.showFilter = false;
        reactiveTableSettings.showNavigation = 'never';
        reactiveTableSettings.showColumnToggles = false;
        reactiveTableSettings.collection = itemsCollection;
        reactiveTableSettings.fields = [{
            key: 'itemId',
            label: __(`${i18nPrefix}.itemId.label`)
        }, {
            key: 'name',
            label: 'Name'
        }, {
            key: 'qty',
            label: __(`${i18nPrefix}.qty.label`),
            fn(value, obj, key) {
                return FlowRouter.query.get('customerId') ? value : Spacebars.SafeString(`<input type="text" value=${value} class="item-qty">`);
            }
        }, /*{
            key: 'price',
            label: __(`${i18nPrefix}.price.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.00');
            }
        }, {
            key: 'amount',
            label: __(`${i18nPrefix}.amount.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.00');
            }
        },*/ {
            key: '_id',
            label() {
                return fa('bars', '', true);
            },
            headerClass: function () {
                let css = 'text-center col-action-exchangeRingPull-item';
                return css;
            },
            tmpl: actionItemsTmpl,
            sortable: false
        }];

        return reactiveTableSettings;
    },
    schema() {
        return RingPullItemsSchema;
    },
    disabledAddItemBtn: function () {
        const instance = Template.instance();
        if (instance.state('tmpAmount') <= 0) {
            return {
                disabled: true
            };
        }

        return {};
    },
    total: function () {
        let total = 0;
        let getItems = itemsCollection.find();
        getItems.forEach((obj) => {
            total += obj.amount;
        });
        total = FlowRouter.query.get('customerId') ? 0 : total;
        if (Session.get('getCustomerId')) {
            Session.set('creditLimitAmount', total);
        }
        return total;
    }
});

itemsTmpl.events({
    'change [name="item-filter"]'(event, instance) {
        //filter item in order-item collection
        let currentValue = event.currentTarget.value;
        switch (currentValue) {
            case 'none-scheme':
                Session.set('itemFilterState', { scheme: { $exists: false } });
                break;
            case 'scheme':
                Session.set('itemFilterState', { scheme: { $exists: true } });
                break;
            case 'all':
                Session.set('itemFilterState', {});
                break;
        }

    },
    'change [name="itemId"]': function (event, instance) {
        instance.name = event.currentTarget.selectedOptions[0].text;
        instance.$('[name="qty"]').val('');
        // instance.$('[name="price"]').val('');
        instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 1 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;
        instance.state('amount', amount);
    },
    'click .js-add-item': function (event, instance) {
       /* let itemId = instance.$('[name="itemId"]').val();
        let qty = instance.$('[name="qty"]').val();
        qty = qty == '' ? 1 : parseInt(qty);
        // let price = 0;
        //let amount = 0;
        let price = math.round(parseFloat(instance.$('[name="price"]').val()), 2);
        let amount = math.round(qty * price, 2);
        // Check exist
        Meteor.call('addScheme', { itemId }, function (err, result) {
            if (!_.isEmpty(result[0])) {
                result.forEach(function (item) {
                    let schemeItem = itemsCollection.findOne({ itemId: item.itemId });
                    if (schemeItem) {
                        let amount = item.price * item.quantity;
                        itemsCollection.update({ itemId: schemeItem.itemId }, {
                            $inc: {
                                qty: item.quantity,
                                amount: amount
                            }
                        });
                    } else {
                        itemsCollection.insert({
                            itemId: item.itemId,
                            qty: item.quantity * qty,
                            price: item.price,
                            amount: (item.price * item.quantity) * qty,
                            name: item.itemName
                        });
                    }
                });
            } else {
                let exist = itemsCollection.findOne({
                    itemId: itemId
                });
                if (exist) {
                    qty += parseInt(exist.qty);
                    amount = math.round(qty * price, 2);

                    itemsCollection.update({
                        _id: exist._id
                    }, {
                            $set: {
                                qty: qty,
                                price: price,
                                amount: amount
                            }
                        });
                } else {
                    itemsCollection.insert({
                        itemId: itemId,
                        qty: qty,
                        price: price,
                        amount: amount,
                        name: instance.name
                    });
                }
            }
        });*/

        let itemId = instance.$('[name="itemId"]').val();
        if(itemId==""){
            alertify.warning('Please choose item.');
            return;
        }
        let qty = instance.$('[name="qty"]').val();
        qty = qty == '' ? 1 : parseInt(qty);
        let price = math.round(parseFloat(instance.$('[name="price"]').val()), 2);
        let amount = math.round(qty * price, 2);
        let stockLocationId = $('[name="stockLocationId"]').val();
        if(stockLocationId==""){
            alertify.warning("Please choose stock location.");
            return;
        }
        let invoice = instance.view.parentView.parentView._templateInstance.data;
        if (invoice) {
            let soldQty = 0;
            if (stockLocationId == invoice.stockLocationId) {
                let oldItem = invoice.items.find(x => x.itemId == itemId);
                soldQty = oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
            }
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let itemOfCollectionNull = itemsCollection.findOne({
                    itemId: itemId
                });
                let checkQty = 0;
                if (itemOfCollectionNull) {
                    checkQty = qty + parseInt(itemOfCollectionNull.qty);
                } else {
                    checkQty = qty;
                }
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                inventoryQty += soldQty;
                if (checkQty <= inventoryQty) {
                    Meteor.call('addScheme', {itemId}, function (err, result) {
                        if (!_.isEmpty(result[0])) {

                            result.forEach(function (item) {
                                // let schemeItem = itemsCollection.findOne({itemId: item.itemId});
                                // if(schemeItem) {
                                //     let amount = item.price * item.quantity;
                                //     itemsCollection.update({itemId: schemeItem.itemId}, {$inc: {qty: item.quantity, amount: amount}});
                                // }else{

                                itemsCollection.insert({
                                    itemId: item.itemId,
                                    qty: item.quantity * qty,
                                    price: item.price,
                                    amount: (item.price * item.quantity) * qty,
                                    name: item.itemName
                                });
                                // }
                            });
                        } else {
                            let exist = itemsCollection.findOne({
                                itemId: itemId
                            });
                            if (exist) {
                                qty += parseInt(exist.qty);
                                amount = math.round(qty * price, 2);

                                itemsCollection.update({
                                    _id: exist._id
                                }, {
                                    $set: {
                                        qty: qty,
                                        price: price,
                                        amount: amount
                                    }
                                });
                            } else {
                                itemsCollection.insert({
                                    itemId: itemId,
                                    qty: qty,
                                    price: price,
                                    amount: amount,
                                    name: instance.name
                                });
                            }
                        }
                    });
                }
                else {
                    alertify.warning('Qty not enough for Exchange Ring Pull. QtyOnHand is ' + inventoryQty);
                }

            });
        } else {
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let itemOfCollectionNull = itemsCollection.findOne({
                    itemId: itemId
                });
                let checkQty = 0;
                if (itemOfCollectionNull) {
                    checkQty = qty + parseInt(itemOfCollectionNull.qty);
                } else {
                    checkQty = qty;
                }
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                if (checkQty <= inventoryQty) {
                    Meteor.call('addScheme', {itemId}, function (err, result) {
                        if (!_.isEmpty(result[0])) {

                            result.forEach(function (item) {
                                // let schemeItem = itemsCollection.findOne({itemId: item.itemId});
                                // if(schemeItem) {
                                //     let amount = item.price * item.quantity;
                                //     itemsCollection.update({itemId: schemeItem.itemId}, {$inc: {qty: item.quantity, amount: amount}});
                                // }else{

                                itemsCollection.insert({
                                    itemId: item.itemId,
                                    qty: item.quantity * qty,
                                    price: item.price,
                                    amount: (item.price * item.quantity) * qty,
                                    name: item.itemName
                                });
                                // }
                            });
                        } else {
                            let exist = itemsCollection.findOne({
                                itemId: itemId
                            });
                            if (exist) {
                                qty += parseInt(exist.qty);
                                amount = math.round(qty * price, 2);

                                itemsCollection.update({
                                    _id: exist._id
                                }, {
                                    $set: {
                                        qty: qty,
                                        price: price,
                                        amount: amount
                                    }
                                });
                            } else {
                                itemsCollection.insert({
                                    itemId: itemId,
                                    qty: qty,
                                    price: price,
                                    amount: amount,
                                    name: instance.name
                                });
                            }
                        }
                    });
                }
                else {
                    alertify.warning('Qty not enough for Exchange Ring Pull. QtyOnHand is ' + inventoryQty);
                }

            });
        }
    },
    // Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.exchangeRingPull.schema.itemId.label')), renderTemplate(editItemsTmpl, this));
    },
    'click .js-destroy-item': function (event, instance) {
        event.preventDefault();
        let itemDoc = this;
        if (AutoForm.getFormId() == "Pos_exchangeRingPullUpdate") { //check if update form
            swal({
                title: "Are you sure?",
                text: "លុបទំនិញមួយនេះ?",
                type: "warning", showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            },
                function () {
                    if (!deletedItem.findOne({ itemId: itemDoc.itemId })) {
                        deletedItem.insert(itemDoc);
                    }
                    itemsCollection.remove({ itemId: itemDoc.itemId });
                    swal.close();
                });
        } else {
            destroyAction(
                itemsCollection, {
                    _id: this._id
                }, {
                    title: TAPi18n.__('pos.exchangeRingPull.schema.itemId.label'),
                    itemTitle: this.itemId
                }
            );
        }

    },
    'change .item-qty'(event, instance) {
        /*let currentQty = event.currentTarget.value;
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({ itemId: itemId });
        let selector = {};
        if (currentQty != '') {
            selector.$set = {
                amount: currentQty * currentItem.price,
                qty: currentQty
            }
        } else {
            selector.$set = {
                amount: 1 * currentItem.price,
                qty: 1
            }
        }
        itemsCollection.update({ itemId: itemId }, selector);*/
        debugger;
        let thisObj = $(event.currentTarget);
        let currentQty =parseInt(event.currentTarget.value);
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId});
        let selector = {};
        if (currentQty != '' || currentQty!=0) {
            selector.$set = {
                amount: currentQty * currentItem.price,
                qty: currentQty
            }
        } else {
            selector.$set = {
                amount: currentItem.qty * currentItem.price,
                qty: currentItem.qty
            };
            currentQty = currentItem.qty;
            thisObj.val(currentItem.qty);
        }

        let invoice = instance.view.parentView.parentView._templateInstance.data;
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (invoice) {
            let soldQty = 0;
            if (stockLocationId == invoice.stockLocationId) {
                soldQty = invoice.items.find(x => x.itemId == itemId).qty;
            }
            Meteor.call('findItem', itemId, function (error, itemResult) {

                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                inventoryQty += soldQty;
                if (currentQty <= inventoryQty) {
                    itemsCollection.update({itemId: itemId}, selector);
                }
                else {
                    selector.$set = {
                        amount: currentItem.qty * currentItem.price,
                        qty: currentItem.qty
                    };
                    itemsCollection.update({itemId: itemId}, selector);
                    thisObj.val(currentItem.qty);
                    alertify.warning('Qty not enough for Exchange Ring Pull. QtyOnHand is ' + inventoryQty);
                }

            });
        }
        else {
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                if (currentQty <= inventoryQty) {
                    itemsCollection.update({itemId: itemId}, selector);
                }
                else {
                    selector.$set = {
                        amount: currentItem.qty * currentItem.price,
                        qty: currentItem.qty
                    };
                    itemsCollection.update({itemId: itemId}, selector);
                    thisObj.val(currentItem.qty);
                    alertify.warning('Qty not enough for Exchange Ring Pull. QtyOnHand is ' + inventoryQty);
                }

            });
        }
    },
    "keypress .item-qty"(evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
});
//destroy
itemsTmpl.onDestroyed(function () {
    Session.set('itemFilterState', {});
});

// Edit
editItemsTmpl.onCreated(function () {
    this.state('amount', 0);

    this.autorun(() => {
        let data = Template.currentData();
        this.state('amount', data.amount);
    });
});

editItemsTmpl.helpers({
    schema() {
        return RingPullItemsSchema;
    },
    data: function () {
        let data = Template.currentData();
        return data;
    }
});

editItemsTmpl.events({
    'change [name="itemId"]': function (event, instance) {
        instance.$('[name="qty"]').val('');
        //instance.$('[name="price"]').val('');
        //instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 0 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;

        instance.state('amount', amount);
    }
});

let hooksObject = {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
        this.event.preventDefault();

        // Check old item
        if (insertDoc.itemId == currentDoc.itemId) {
            itemsCollection.update({
                _id: currentDoc._id
            },
                updateDoc
            );
        } else {
            // Check exist item
            let exist = itemsCollection.findOne({
                _id: insertDoc._id
            });
            if (exist) {
                let newQty = exist.qty + insertDoc.qty;
                let newPrice = insertDoc.price;
                let newAmount = math.round(newQty * newPrice, 2);

                itemsCollection.update({
                    _id: insertDoc._id
                }, {
                        $set: {
                            qty: newQty,
                            price: newPrice,
                            amount: newAmount
                        }
                    });
            } else {
                itemsCollection.remove({
                    _id: currentDoc._id
                });
                itemsCollection.insert(insertDoc);
            }
        }

        this.done();
    },
    onSuccess: function (formType, result) {
        alertify.item().close();
        displaySuccess();
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Pos_exchangeRingPullItemsEdit'], hooksObject);
