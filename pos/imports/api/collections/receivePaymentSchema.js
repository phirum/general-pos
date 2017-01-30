export const receivePaymentSchema = new SimpleSchema({
    customerBalance: {
        type: String,
        label: 'Customer Balance',
        optional: true
    },
    depositTo: {
        type: String,
        label: 'Deposit To',
        optional: true
    },
    invoiceId: {
        type: String,
        label: 'Find by invoice ID#',
        optional: true
    },
    exchangeRate: {
        type: String,
        label: 'Exchange 1USD = ',
        optional: true
    },
    paymentDate: {
        type: Date,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',
                }
            }

        }
    },
    accountReceivable: {
        type: String,
        label: 'A/R Account',
        optional: true
    },
    voucherId: {
        type: String,
        optional: true,
        label: 'Voucher #'
    },
    customerId: {
        type: String,
        label: 'Receive From',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
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
    paymentMethods: {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                // optionsMethod: 'pos.selectOptMethods.customer',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    }
});
