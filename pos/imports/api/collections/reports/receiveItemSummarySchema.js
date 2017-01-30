import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

export const receiveItemSummarySchema = new SimpleSchema({
    fromDate: {
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
    toDate: {
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

    type: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            multiple: true,
            afFieldInput: {
                uniPlaceholder: 'All',
                options() {
                    return [
                        {label: 'Prepaid Order', value: 'PrepaidOrder'},
                        {label: 'Lending Stock', value: 'LendingStock'},
                        {label: 'Gratis Exchange', value: 'ExchangeGratis'},
                        {label: 'Company Ring Pull Exchange', value: 'CompanyExchangeRingPull'}
                    ];
                }
            }

        }
    }
});