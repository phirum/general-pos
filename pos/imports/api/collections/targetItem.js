import {itemInfo} from '../../../common/methods/item-info.js';
let defaultPrice = new ReactiveVar(0);
export const TargetItem = new Mongo.Collection('pos_targetItem');
TargetItem.schema = new SimpleSchema({
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
    startDate: {
        type: Date,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'MM/YYYY',

                }
            }

        }
    },
    endDate: {
        type: Date,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'MM/YYYY',

                }
            }

        }
    },
    amount: {
        type: Number,
        decimal: true
    },
    description: {
        type: String,
        optional: true
    }
});


TargetItem.attachSchema(TargetItem.schema);
