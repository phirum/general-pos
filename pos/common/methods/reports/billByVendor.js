import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {EnterBills} from '../../../imports/api/collections/enterBill';
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
export const billByVendorReport = new ValidatedMethod({
    name: 'pos.billByVendorReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branch = [];
            let user = Meteor.users.findOne(Meteor.userId());
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})

            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.billType = {$ne: 'group'};
            selector.status = {$in: ['active', 'partial', 'closed']};
            if(params.branchId) {
                selector.branchId = params.branchId;
            }else {
                return data;
            }
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                data.title.exchange = `USD = ${coefficient.usd.$multiply[1]} $, KHR = ${coefficient.khr.$multiply[1]}<small> ៛</small>, THB = ${coefficient.thb.$multiply[1]} B`;
                selector.enterBillDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.vendor && params.vendor != '') {
                selector.vendorId = params.vendor;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                data.fields.push({field: 'Type'});
                data.displayFields.push({field: 'bill'});
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: filters[i]});
                    project[filters[i]] = `$${filters[i]}`;
                    if (filters[i] == 'vendorId') {
                        project['vendor'] = '$_vendor'
                    }
                    if (filters[i] == 'repId') {
                        project['repId'] = '$repId.name'
                    }
                }
                data.fields.push({field: 'Amount'});//map total field for default
                data.displayFields.push({field: 'total'});
                project['bill'] = '$bill';
                project['total'] = '$total'; //get total projection for default
            } else {
                project = {
                    'bill': '$bill',
                    '_id': '$_id',
                    'enterBillDate': '$enterBillDate',
                    'total': '$total'
                };
                data.fields = [{field: 'Type'}, {field: 'ID'}, {field: 'Date'}, {field: 'Amount'}];
                data.displayFields = [{field: 'bill'}, {field: '_id'}, {field: 'enterBillDate'}, {field: 'total'}];
            }
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let bills = EnterBills.aggregate([
                {
                    $match: selector
                },
                {
                    $lookup: {
                        from: 'pos_reps',
                        localField: 'repId',
                        foreignField: '_id',
                        as: 'repId'
                    }
                },
                {$unwind: {path: '$repId', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        bill: {$concat: ["Bill", '']},
                        totalUsd: coefficient.usd,
                        totalThb: coefficient.thb,
                        totalKhr: coefficient.khr,
                        vendorId: 1,
                        total: 1,
                        _id: 1,
                        dueDate: 1,
                        enterBillDate: 1,
                        branchId: 1,
                        createdAt: 1,
                        createdBy: 1,
                        billType: 1,
                        items: 1,
                        profit: 1,
                        repId: 1,
                        staffId: 1,
                        stockLocationId: 1,
                        totalCost: 1,
                        status: 1
                    }
                },
                {
                    $lookup: {
                        from: 'pos_vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: '_vendor'
                    }
                },
                {
                    $unwind: {
                        preserveNullAndEmptyArrays: true,
                        path: '$_vendor'
                    }
                },

                {
                    $group: {
                        _id: '$vendorId',
                        vendor: {$addToSet: '$_vendor'},
                        data: {$addToSet: project},
                        total: {$sum: '$totalUsd'},
                        totalKhr: {$sum: '$totalKhr'},
                        totalThb: {$sum: '$totalThb'}
                    }
                },
                {$unwind: {path: '$vendor', preserveNullAndEmptyArrays: true}},
                {$sort: {'vendor.name': 1}},
                {
                    $group: {
                        _id: null,
                        content: {
                            $addToSet: '$$ROOT'
                        },
                        total: {$sum: '$total'},
                        totalKhr: {$sum: '$totalKhr'},
                        totalThb: {$sum: '$totalThb'},
                    }
                }]);
            if (bills.length > 0) {
                data.content = bills[0].content;
                data.footer = {
                    total: bills[0].total,
                    totalKhr: bills[0].totalKhr,
                    totalThb: bills[0].totalThb
                }
            }
            return data
        }
    }
});
