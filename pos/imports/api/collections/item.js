import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Units} from './units.js';
import {Meteor} from 'meteor/meteor';
// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../../../acc/imports/ui/libs/select-opts';
export const Item = new Mongo.Collection("pos_item");
let accountMapping = new SimpleSchema({
    inventoryAsset: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountAsset();
            }
        }
    },
    incomeAccount: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountIncome();
            }
        }
    },
    expenseAccount: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountExpense();
            }
        }
    },
    accountReceivable: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountAsset();
            }
        }
    },
    accountPayable: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountLiability();
            }
        }
    },
    saleDiscount: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountIncome();
            }
        }
    },
    purchaseDiscount: {
        type: String,
        optional: true,
        autoform: {
            type: "select2",
            placeholder: "Chart Of Account",
            options: function () {
                return SelectOpts.chartAccountExpense();
            }
        }
    }
});
Item.schema = new SimpleSchema({
    name: {
        type: String,
        unique: true,
        max: 200
    },
    price: {
        type: Number,
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    purchasePrice: {
        type: Number,
        decimal: true,
        min: 0,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    photo: {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'fileUpload',
                collection: 'Files',
                accept: 'image/*'
            }
        }
    },
    barcode: {
        type: String,
        optional: true
    },
    unitId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                label: {
                    class: 'label label-success'
                },
                uniPlaceholder: 'Select One',
            },
            options(){
                let list = [];
                try {
                    Meteor.subscribe('pos.unit', {}, {sort: {_id: 1}});
                } catch (e) {

                }
                let units = Units.find() || 0;
                if (units.count() > 0) {
                    units.forEach((unit)=> {
                        list.push({label: `${unit._id}: ${unit.name}`, value: unit._id})
                    })
                }
                return list;
            }
        }
    },
    sellingUnit: {
        type: [Object],
        optional: true
    },
    'sellingUnit.$.unitId': {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
            },
            options(){
                let list = [];
                let units = Units.find() || 0;
                if (units.count() > 0) {
                    units.forEach((unit)=> {
                        list.push({label: `${unit._id}: ${unit.name}`, value: unit._id})
                    })
                }
                return list;
            }
        }
    },
    'sellingUnit.$.converter': {
        type: Number,
        decimal: true
    },
    scheme: {
        type: [Object],
        optional: true
    },
    'scheme.$.itemId': {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item'
            }
        }
    },
    'scheme.$.price': {
        type: Number,
        decimal: true
    },
    'scheme.$.quantity': {
        type: Number,
        decimal: true
    },
    categoryId: {
        type: String,
        autoform: {
            type: 'select2',
            /*options(){
             return SelectOpts.category('Select Parent | No Parent');
             }*/
        }
    },
    itemType: {
        type: String,
        autoform: {
            type: 'universe-select',
            options(){
                return [{
                    label: '(Select One)',
                    value: ''
                }, {
                    label: 'None Stock',
                    value: 'noneStock'
                }, {
                    label: 'Stock',
                    value: 'stock'
                }]
            }
        }
    },
    status: {
        type: String,
        optional: true
    },
    accountMapping: {
        type: accountMapping,
        optional: true
    },
    mappingEnable:{
        type: Boolean,
        optional: true
    },
    qtyOnHand:{
        type:Object,
        optional:true,
        blackbox:true
    }
});

Meteor.startup(function () {
    Item.schema.i18n("pos.item.schema");
    Item.attachSchema(Item.schema);
});
