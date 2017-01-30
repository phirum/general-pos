import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';
import {StockLocations} from '../../collections/stockLocation';
import {SelectOpts} from '../../../../../core/imports/ui/libs/select-opts.js';
export const stockBalanceSchema = new SimpleSchema({
    branch: {
        type: [String],
        optional: true,
        label: function () {
            return TAPi18n.__('core.welcome.branch');
        },
        autoform: {
            type: "universe-select",
            multiple: true,
            options: function () {
                return Meteor.isClient && SelectOpts.branchForCurrentUser(false);
            },
            afFieldInput: {
                value: function () {
                    return Meteor.isClient && Session.get('currentBranch');
                }
            }
        }
    },
    asOfDate: {
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
    items: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                create: true,
                uniPlaceholder: 'All',
                multiple: true,
                optionsMethod: 'pos.selectOptMethods.item'
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
                        label: 'Item',
                        value: 'lastDoc.itemDoc.name'
                    },
                    {
                        label: 'Price',
                        value: 'lastDoc.price'
                    },
                    {
                        label: 'Unit',
                        value: 'lastDoc.itemDoc._unit.name'
                    },
                    {
                        label: 'Branch',
                        value: 'lastDoc.branchDoc.enShortName'
                    },
                    {
                        label: 'Location',
                        value: 'lastDoc.locationDoc.name'
                    }
                ]
            }
        }
    },
    location: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            uniPlaceholder: 'All',
            multiple: true,
            options(){
                let list = [];
                let selector = {};
                let branchId = AutoForm.getFieldValue('branch') || Meteor.isClient && [Session.get('currentBranch')] ;
                if (branchId) {
                    var subLocation = Meteor.subscribe('pos.stockLocation', {branchId: {$in: branchId}}, {});
                    if(subLocation.ready()) {
                        let locations = StockLocations.find({});
                        locations.forEach(function (location) {
                            list.push({label: `${location._id}: ${location.name}`, value: location._id});
                        });
                        return list;
                    }
                }
                return list;
            }
        }
    }
});
