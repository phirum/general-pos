import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
//lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import ReportFn from "../../../imports/api/libs/report";
export const receivePaymentReport = new ValidatedMethod({
    name: 'pos.receivePaymentReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let skip = 0;
            let limit = 500;
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };

            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.status = {
                $in: ['partial', 'closed']
            };
            let branchId = [];
            if(!params.branchId) {
                let user = Meteor.users.findOne(Meteor.userId());
                selector.branchId = {
                    $in: user.rolesBranch
                }
            }
            if (params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            if (params.skip) {
                skip = parseInt(params.skip);
            }
            if (params.limit) {
                limit = parseInt(params.limit) <= 0 ? 500 : parseInt(params.limit);
            }
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.paymentDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: filters[i]});
                    project[filters[i]] = `$${filters[i]}`;
                    if (filters[i] == 'customerId') {
                        project['_customer'] = '$_customer'
                    }
                }
                data.fields.push({field: 'Due Amount'}); //map Due Amount field for default
                data.fields.push({field: 'Paid Amount'}); //map Paid Amount field for default
                data.fields.push({field: 'Balance Amount'}); //map Balance Amount field for default
                data.displayFields.push({field: 'dueAmount'});
                data.displayFields.push({field: 'paidAmount'});
                data.displayFields.push({field: 'balanceAmount'});
                project['dueAmount'] = '$dueAmount'; //get total projection for default
                project['paidAmount'] = '$paidAmount';
                project['balanceAmount'] = '$balanceAmount';
            } else {
                project = {
                    '_id': '$_id',
                    'invoiceId': '$invoiceId',
                    'paymentDate': '$paymentDate',
                    'customerId': '$customerId',
                    '_customer': '$_customer',
                    'dueAmount': '$dueAmount',
                    'paidAmount': '$paidAmount',
                    'balanceAmount': '$balanceAmount'
                };
                data.fields = [{field: '#ID'}, {field: '#Invoice'}, {field: 'Date'}, {field: 'Customer'}, {field: 'Due Amount'}, {field: 'Paid Amount'}, {field: 'Balance Amount'}];
                data.displayFields = [{field: '_id'}, {field: 'invoiceId'}, {field: 'paymentDate'}, {field: 'customerId'}, {field: 'dueAmount'}, {field: 'paidAmount'}, {field: 'balanceAmount'}];
            }
            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let receivePayments = ReceivePayment.aggregate([
                {
                    $match: selector
                },
                {$skip: skip},
                {$limit: limit},
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: '_customer'
                    }
                },
                {$unwind: {path: '$_customer', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        actualDueAmount: {
                            $divide: [
                                '$dueAmount',
                                {
                                    $subtract: [1,
                                        {
                                            $divide: ['$discount', 100]
                                        }
                                    ]
                                }
                            ]
                        },
                        _customer: 1,
                        _id: 1,
                        invoiceId: 1,
                        paymentDate: 1,
                        discount: 1,
                        paymentType: 1,
                        penalty: 1,
                        status: 1,
                        dueAmount: 1,
                        balanceAmount: 1,
                        paidAmount: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        data: {
                            $addToSet: project
                        },
                        dueAmount: {
                            $sum: '$dueAmount'
                        },
                        balanceAmount: {
                            $sum: '$balanceAmount'
                        },
                        paidAmount: {
                            $sum: '$paidAmount'
                        }
                    }
                }]);
            if (receivePayments.length > 0) {
                let sortData = _.sortBy(receivePayments[0].data, '_id');
                receivePayments[0].data = sortData
                data.content = receivePayments;
            }
            return data
        }
    }
});



