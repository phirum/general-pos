import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Invoices = new Mongo.Collection("pos_invoices");
// Items sub schema
Invoices.itemsSchema = new SimpleSchema({
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
    },
    imei: {
        type: [String],
        label: "IMEI",
        optional: true
    },
    discount: {
        type: Number,
        decimal: true
    }
});

// Invoices schema
Invoices.schema = new SimpleSchema({
    printId: {
        type: String,
        optional: true
    },
    voucherId: {
        type: String,
        optional: true
    },
    isWholesale: {
        type: Boolean,
        label: "Wholesale"
    },
    invoiceDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',

                },
                value(){
                    let customerId = AutoForm.getFieldValue('customerId');
                    if (customerId) {
                        return moment().toDate();
                    }
                }
            }

        }
    },
    dueDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',

                }
            }
        }
    },
    customerId: {
        type: String,
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
    termId: {
        type: String,
        label: 'Terms',
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One'
            }
        }
    },
    paymentGroupId: {
        type: String,
        optional: true
    },
    repId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One'
            }
        }
    },
    staffId: {
        type: String,
        autoValue(){
            if (this.isInsert) {
                return Meteor.user()._id;
            }
        }
    },
    des: {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'textarea',
            }
        }
    },
    items: {
        type: [Invoices.itemsSchema]
    },
    total: {
        type: Number,
        decimal: true,
        /*autoform: {
         type: 'inputmask',
         inputmaskOptions: function () {
         return inputmaskOptions.currency();
         }
         }*/
    },
    paid: {
        type: Number,
        decimal: true,
        optional: true,
        /*autoform: {
         type: 'inputmask',
         inputmaskOptions: function () {
         return inputmaskOptions.currency();
         }
         }*/
    },
    discount: {
        type: Number,
        decimal: true,
        /* autoform: {
         type: 'inputmask',
         inputmaskOptions: function () {
         return inputmaskOptions.currency();
         }
         }*/
    },
    subTotal: {
        type: Number,
        decimal: true,
        /* autoform: {
         type: 'inputmask',
         inputmaskOptions: function () {
         return inputmaskOptions.currency();
         }
         }*/
    },
    stockLocationId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.stockLocationMapping',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentUserStockAndAccountMappingDoc = Session.get('currentUserStockAndAccountMappingDoc');
                        let stockLocations = [];
                        if (currentUserStockAndAccountMappingDoc && currentUserStockAndAccountMappingDoc.stockLocations) {
                            stockLocations = currentUserStockAndAccountMappingDoc.stockLocations;
                        }
                        let currentBranch = Session.get('currentBranch');
                        return {
                            branchId: currentBranch,
                            stockLocations: {
                                $in: stockLocations
                            }
                        };
                    }
                }
            }
        }
    },
    branchId: {
        type: String
    },
    status: {
        type: String,
        optional: true
    },
    invoiceType: {
        type: String,
        optional: true
    },
    saleId: {
        type: String,
        optional: true
    },
    closedAt: {
        type: Date,
        optional: true
    },
});

Meteor.startup(function () {
    Invoices.itemsSchema.i18n("pos.invoice.schema");
    Invoices.schema.i18n("pos.invoice.schema");
    Invoices.attachSchema(Invoices.schema);
});
