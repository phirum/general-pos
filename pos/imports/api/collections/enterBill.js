import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const EnterBills = new Mongo.Collection("pos_enterBills");

// Items sub schema
EnterBills.itemsSchema = new SimpleSchema({
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

// EnterBills schema
EnterBills.schema = new SimpleSchema({
    voucherId: {
        type: String,
        optional: true
    },
    enterBillDate: {
        type: Date,
        // defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',

                },
                value(){
                    let vendorId = AutoForm.getFieldValue('vendorId');
                    if(vendorId) {
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
                    format: 'DD/MM/YYYY HH:mm:ss'
                }
            }
        }
    },
    vendorId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.vendor',
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
        optional: true,
        autoValue(){
            if (this.isInsert)
                return Meteor.user()._id;
        }
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
                        let stockLocations = currentUserStockAndAccountMappingDoc == undefined ? ' ' : currentUserStockAndAccountMappingDoc.stockLocations ;
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
                    height: 80,                 // set editor height
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
        type: [EnterBills.itemsSchema],
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
    branchId: {
        type: String
    },
    billType: {
        type: String,
        optional: true
    },
    closedAt: {
        type: Date,
        optional: true
    }
});

Meteor.startup(function () {
    EnterBills.itemsSchema.i18n("pos.enterBill.schema");
    EnterBills.schema.i18n("pos.enterBill.schema");
    EnterBills.attachSchema(EnterBills.schema);
});
