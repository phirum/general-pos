export const TransferMoney = new Mongo.Collection('pos_transferMoney');
TransferMoney.schema = new SimpleSchema({
    transferMoneyDate: {
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
        autoValue(){
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
    status: {
        type: String,
        autoValue(){
            if(this.isInsert) {
                return 'active'
            }
        }
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
    transferAmount: {
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
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.transferMoneyBranch',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Meteor.isClient && Session.get('currentBranch');
                        return {_id:  {$eq: currentBranch}};
                    }
                }
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
                optionsMethod: 'pos.selectOptMethods.transferMoneyBranch',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Meteor.isClient && Session.get('currentBranch');
                        return {_id: {$ne: currentBranch}};
                    }
                }
            }
        }
    },
    pending: {
        type: Boolean,
        autoValue(){
            if (this.isInsert) {
                return true;
            }
        }
    }
});
Meteor.startup(function () {
    TransferMoney.schema.i18n("pos.transferMoney.schema");
    TransferMoney.attachSchema(TransferMoney.schema);
});