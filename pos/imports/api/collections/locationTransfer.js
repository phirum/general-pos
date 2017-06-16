import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';
//methods
import {itemInfo} from '../../../common/methods/item-info';
// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';
//location
import {StockLocations} from '../../api/collections/stockLocation';
let defaultPrice = new ReactiveVar(0);
let defaultBaseUnit = new ReactiveVar();
let itemFilterSelector = new ReactiveVar({});
export const LocationTransfersItemSchema = new SimpleSchema({
    itemId: {
        type: String,
        label: 'Item',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                create: true,
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        return {scheme: {$exists: false}, itemType: 'stock'};
                    }
                }
            }
        }
    },
    qty: {
        type: Number,
        label: 'Qty',
        optional: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    price: {
        type: Number,
        label: 'Price',
        decimal: true,
        optional: true,
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
        },
        autoform: {
            type: 'inputmask',
            optional: true,
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    baseUnit: {
        type: String,
        optional: true,
        autoform: {
            type: 'select',
            afFieldInput: {
                style: 'width: 100%'
            },
            options() {
                let id = AutoForm.getFieldValue('itemId');
                let arr = [];
                let customerId = Session.get('getCustomerId') || Session.get('saleOrderCustomerId');
                if (id) {
                    itemInfo.callPromise({
                        _id: id, customerId: customerId
                    }).then(function (result) {
                        if (data.sellingUnit) {
                            defaultBaseUnit.set(data.sellingUnit);
                        } else {
                            defaultBaseUnit.set(arr);
                        }
                    }).catch(function (err) {
                        console.log(err.message);
                    });
                }
                return defaultBaseUnit.get();
            }
        }
    },
    qtyConvert: {
        type: Number,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.decimal();
            }
        }
    },
    amount: {
        type: Number,
        label: 'Amount',
        optional: true,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }

    }
});
export const LocationTransfers = new Mongo.Collection("pos_locationTransfers");
// Items sub schema
LocationTransfers.itemsSchema = new SimpleSchema({
    itemId: {
        type: String
    },
    qty: {
        type: Number,
        min: 1
    },
    price: {
        type: Number,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    amount: {
        type: Number,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    }
});

// LocationTransfers schema
LocationTransfers.schema = new SimpleSchema({
    locationTransferDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss'
                }
            }
        }
    },
    fromUserId: {
        type: String,
        autoValue() {
            if (this.isInsert) {
                return Meteor.userId();
            }
        },
        autoform: {
            type: 'universe-select',
        }
    },
    toUserId: {
        type: String,
        optional: true
    },
    fromStockLocationId: {
        type: String,
        label: 'From Stock Location',
        autoform: {
            type: 'universe-select',
            uniPlaceholder: 'Select One',
            options() {
                let list = [];
                let branchId = AutoForm.getFieldValue('branch') || Meteor.isClient && Session.get('currentBranch');
                if (branchId) {
                    var subLocation = Meteor.subscribe('pos.stockLocation', {branchId: branchId}, {});
                    if (subLocation.ready()) {
                        let locations = StockLocations.find({branchId: branchId});
                        locations.forEach(function (location) {
                            list.push({label: `${location._id}: ${location.name}`, value: location._id});
                        });
                        return list;
                    }
                }
                return list;
            }
        }
    },
    toStockLocationId: {
        type: String,
        label: 'To Stock Location',
        autoform: {
            type: 'universe-select',
            uniPlaceholder: 'Select One',
            options() {
                let list = [];
                let branchId = AutoForm.getFieldValue('toBranchId');
                if (branchId) {
                    var subLocation = Meteor.subscribe('pos.stockLocation', {branchId: branchId}, {});
                    if (subLocation.ready()) {
                        let locations = StockLocations.find({branchId: branchId});
                        locations.forEach(function (location) {
                            list.push({label: `${location._id}: ${location.name}`, value: location._id});
                        });
                        return list;
                    }
                }
                return list;
            }
        }
    },
    status: {
        type: String
    },
    des: {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'summernote',
                class: 'editor', // optional
                settings: {
                    height: 150,                 // set editor height
                    minHeight: null,             // set minimum height of editor
                    maxHeight: null,             // set maximum height of editor
                    toolbar: [
                        ['font', ['bold', 'italic', 'underline', 'clear']], //['font', ['bold', 'italic', 'underline', 'clear']],
                        ['para', ['ul', 'ol']] //['para', ['ul', 'ol', 'paragraph']],
                        //['insert', ['link', 'picture']], //['insert', ['link', 'picture', 'hr']],
                    ]
                } // summernote options goes here
            }
        }
    },
    items: {
        type: [LocationTransfers.itemsSchema],
    },
    total: {
        type: Number,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    fromBranchId: {
        type: String,
        autoValue() {
            if (this.isInsert) {
                var branchId = this.field('fromStockLocationId').value;
                return branchId && branchId.split('-')[0];
            }
        }
    },
    toBranchId: {
        type: String,
        label: 'To Branch',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.branch',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Meteor.isClient && Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    pending: {
        type: Boolean,
        autoValue() {
            if (this.isInsert) {
                return true;
            }
        }
    },
    journalDate: {
        type: Date,
        optional: true
    }
});

Meteor.startup(function () {
    LocationTransfers.itemsSchema.i18n("pos.locationTransfer.schema");
    LocationTransfers.schema.i18n("pos.locationTransfer.schema");
    LocationTransfers.attachSchema(LocationTransfers.schema);
});
