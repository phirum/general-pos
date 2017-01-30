import {itemInfo} from '../../../common/methods/item-info.js';
let defaultPrice = new ReactiveVar(0);
export const ItemPriceForCustomers = new Mongo.Collection('pos_itemPriceForCustomer');
export const ItemPriceForCustomersDetail = new SimpleSchema({
    itemId: {
        type: String,
        label: 'Item',
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item'
            }
        }
    },
    price: {
        label: 'Price',
        type: Number,
        optional: true,
        decimal: true,
        defaultValue: function () {
            let id = AutoForm.getFieldValue('itemId');
            if (id) {
                itemInfo.callPromise({
                    _id: id
                }).then(function (result) {
                    defaultPrice.set(result.price);
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                defaultPrice.set(0);
            }

            return defaultPrice.get();
        }
    }
});
ItemPriceForCustomers.schema = new SimpleSchema({
    customerId: {
        type: String,
        unique: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search .... (Limit 10)',
                optionsMethod: 'pos.selectOptMethods.customer',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    items: {
        type: [Object]
    },
    'items.$.itemId': {
        type: String,
    },
    'items.$.price': {
        type: Number,
        decimal: true
    },
    description: {
        type: String,
        optional: true
    },
    _customer: {
        type: Object,
        optional: true,
        blackbox: true
    }
});


ItemPriceForCustomers.attachSchema(ItemPriceForCustomers.schema);
