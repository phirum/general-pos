import {ReactiveDict} from 'meteor/reactive-dict';
import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import {$} from 'meteor/jquery';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import 'meteor/theara:template-states';

// Lib
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../../core/client/components/loading.js';
import '../../../../../core/client/components/column-action.js';
import '../../../../../core/client/components/form-footer.js';

// Collection
import {ItemsSchema} from '../../../api/collections/order-items.js';
import {ReceiveItems} from '../../../api/collections/receiveItem.js';

// Declare template
var itemsTmpl = Template.Pos_receiveItemItems,
    actionItemsTmpl = Template.Pos_receiveItemItemsAction,
    editItemsTmpl = Template.Pos_receiveItemItemsEdit;


// Local collection
var itemsCollection;
export const ReceiveDeletedItem = new Mongo.Collection(null); //export collection deletedItem to invoice js

// Page
import './receiveItem-items.html';

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
    notActivatedPrepaidOrder(){
        /// console.log('inside not activated');
        if (FlowRouter.query.get('vendorId')) {
            return false;
        }
        return true;
    },
    tableSettings: function () {
        console.log(itemsCollection.find().fetch());
        let i18nPrefix = 'pos.receiveItem.schema';

        reactiveTableSettings.showFilter = false;
        reactiveTableSettings.showNavigation = 'never';
        reactiveTableSettings.showColumnToggles = false;
        reactiveTableSettings.collection = itemsCollection;
        reactiveTableSettings.fields = [{
            key: 'itemId',
            label: ''
        }, {
            key: 'name',
            label: ''
        }, {
            key: 'qty',
            label: __(`${i18nPrefix}.qty.label`),
            fn(value, obj, key){
                return FlowRouter.query.get('vendorId') ? value : Spacebars.SafeString(`<input type="text" value=${value} class="item-qty">`);
            }
        }, {
            key: 'lostQty',
            label: __(`${i18nPrefix}.lostQty.label`),
            fn(value, obj, key){
                return Spacebars.SafeString(`<input type="text" value=${value} class="lost-qty">`);
            }
        },
            {
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
            }, {
                key: '_id',
                label() {
                    return fa('bars', '', true);
                },
                headerClass: function () {
                    let css = 'text-center col-action-receiveItem-item';
                    return css;
                },
                tmpl: actionItemsTmpl,
                sortable: false
            }];

        return reactiveTableSettings;
    },
    schema() {
        return ItemsSchema;
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
        return FlowRouter.query.get('vendorId') ? 0 : total;
        // return Session.get('subTotal')
    },
});


itemsTmpl.events({
    'keyup #discount'(){
        let subTotal = 0;
        let getItems = itemsCollection.find();
        getItems.forEach((obj) => {
            subTotal += obj.amount;
        });
        let discount = $('#discount').val();
        discount = discount == "" ? 0 : parseFloat(discount);
        $('#total').val(subTotal * (1 - discount / 100));
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
        qty = _.isEmpty(qty) ? 0 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;

        instance.state('amount', amount);
    },
    'click .js-add-item': function (event, instance) {
        let itemId = instance.$('[name="itemId"]').val();
        if (itemId == "") {
            sAlert.warning("Please select Item");
            return;
        }
        let qty = instance.$('[name="qty"]').val();
        qty = qty == "" ? 1 : parseInt(qty);
        let price = math.round(parseFloat(instance.$('[name="price"]').val()), 2);
        let amount = math.round(qty * price, 2);
        // Check exist
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
                exactQty: qty,
                price: price,
                lostQty: 0,
                amount: amount,
                name: instance.name
            });
        }
    },
    // Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.receiveItem.schema.itemId.label')), renderTemplate(editItemsTmpl, this));
    },
    /*  'click .js-destroy-item': function (event, instance) {
     destroyAction(
     itemsCollection, {
     _id: this._id
     }, {
     title: TAPi18n.__('pos.receiveItem.schema.itemId.label'),
     itemTitle: this.itemId
     }
     );
     },*/
    'click .js-destroy-item': function (event, instance) {
        event.preventDefault();
        let itemDoc = this;
        console.log('fuck you bitch swal');
        if (AutoForm.getFormId() == "Pos_receiveItemEdit") { //check if update form
            swal({
                title: "Are you sure?",
                text: "លុបទំនិញមួយនេះ?",
                type: "warning", showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }).then(
                function () {
                    if (!ReceiveDeletedItem.findOne({itemId: itemDoc.itemId})) {
                        ReceiveDeletedItem.insert(itemDoc);
                    }
                    itemsCollection.remove({itemId: itemDoc.itemId});
                    swal.close();
                });
        } else {
            destroyAction(
                itemsCollection, {
                    _id: this._id
                }, {
                    title: TAPi18n.__('pos.receiveItem.schema.itemId.label'),
                    itemTitle: this.itemId
                }
            );
        }

    },
    'change .item-qty'(event, instance){
        let currentQty = event.currentTarget.value;
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId});
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
        itemsCollection.update({itemId: itemId}, selector);
    },
    'change .lost-qty'(event, instance){
        let currentLostQty = event.currentTarget.value;
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId});
        let selector = {};
        debugger
        if (currentLostQty >= currentItem.exactQty) {
            $(event.currentTarget).val(0);
            selector.$set = {
                amount: currentItem.exactQty * currentItem.price,
                qty: currentItem.exactQty,
                lostQty: 0
            }
        } else {
            if (currentLostQty != '') {
                selector.$set = {
                    amount: (currentItem.exactQty - currentLostQty) * currentItem.price,
                    qty: currentItem.exactQty - currentLostQty,
                    lostQty: currentLostQty
                }
            } else if (currentLostQty == '0') {
                selector.$set = {
                    amount: currentItem.exactQty * currentItem.price,
                    qty: currentItem.exactQty,
                    lostQty: currentLostQty
                }
            }
            else {
                selector.$set = {
                    amount: currentItem.exactQty * currentItem.price,
                    qty: currentItem.exactQty,
                    lostQty: currentLostQty
                }
            }
        }

        itemsCollection.update({itemId: itemId}, selector);
    },
    "keypress .item-qty .lost-qty" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
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
        return ItemsSchema;
    },
    data: function () {
        let data = Template.currentData();
        return data;
    }
});

editItemsTmpl.events({
    'change [name="itemId"]': function (event, instance) {
        instance.$('[name="qty"]').val('');
        instance.$('[name="price"]').val('');
        instance.$('[name="amount"]').val('');
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
AutoForm.addHooks(['Pos_receiveItemItemsEdit'], hooksObject);


var calculateTotal = function () {
    let subTotal = 0;
    let getItems = itemsCollection.find();
    getItems.forEach((obj) => {
        subTotal += obj.amount;
    });
    var discount = $('#discount').val();
    discount = discount == "" ? 0 : parseFloat(discount);
    var total = subTotal * (1 - discount / 100);
    Session.set('total', total);
    // Session.set('subTotal',subTotal);

};

itemsTmpl.onDestroyed(function () {
    Session.set('total', 0);
});
