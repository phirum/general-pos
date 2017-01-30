import {itemInfo} from '../../../common/methods/item-info.js';
let defaultPrice = new ReactiveVar(0);
export const QuantityRangeMapping = new Mongo.Collection('pos_quantityRangeMapping');
QuantityRangeMapping.schema = new SimpleSchema({
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
    startQty: {
        type: Number,
        decimal: true
    },
    endQty: {
        type: Number,
        decimal: true
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
    },
    commission: {
      type: Number,
        decimal: true
    },
    description:{
        type: String,
        optional: true
    }
});


QuantityRangeMapping.attachSchema(QuantityRangeMapping.schema);
