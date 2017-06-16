import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';
let vendorFilter = ReactiveVar();

Tracker.autorun(function () {
    if(Session.get('vendorFilter')) {
        vendorFilter.set(Session.get('vendorFilter'));
    }
});

export const billReportSchema = new SimpleSchema({
    fromDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',

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
                    format: 'DD/MM/YYYY',

                }
            }
        }
    },
    vendorId: {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'All',
                optionsMethod: 'pos.selectOptMethods.vendor',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        if(vendorFilter.get()){
                            return {branchId: currentBranch, paymentType: vendorFilter.get()}
                        }
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    filter: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            multiple: true,
            uniPlaceholder: 'All',
            options(){
                return [
                    {
                        label: '#ID',
                        value: '_id'
                    },
                    {
                        label: 'Vendor',
                        value: 'vendorId'
                    },
                    {
                        label: 'Date',
                        value: 'enterBillDate'
                    },
                    {
                        label: 'Status',
                        value: 'status'
                    },
                    {
                        label: 'Type',
                        value: 'billType'
                    }
                ]
            }
        }
    },
    type: {
        type: String,
        optional: true,
        autoform: {
            type: 'select',
            options() {
                return [{label: 'Term', value: 'Term'}, {label: 'Group', value: 'Group'}];
            }
        }
    },
    status: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            multiple: true,
            uniPlaceholder: 'All',
            options(){
                return [
                    {
                        label: 'Active',
                        value: 'active'
                    },
                    {
                        label: 'Closed',
                        value: 'closed'
                    },
                    {
                        label: 'Partial',
                        value: 'partial'
                    }
                ]
            }
        }
    },
});