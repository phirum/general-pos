import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const groupReport = new ValidatedMethod({
    name: 'pos.groupReport',
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
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.status = {$in: ['active', 'closed']};
            if(params.customer && params.customer != '') {
                selector.vendorOrCustomerId = params.customer;
            }
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD') + ' - ' + moment(toDate).format('YYYY-MMM-DD');
                selector.startDate = {$lte: toDate};
                selector.endDate = {$gte: fromDate};
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
                data.fields.push({field: 'Total'}); //map total field for default
                data.displayFields.push({field: 'total'});
                project['total'] = '$total'; //get total projection for default
            } else {
                project = {
                    '_id': '$_id',
                    'startDate': '$startDate',
                    'endDate': '$endDate',
                    'status': '$status',
                    'customer': '$customerDoc',
                    'total': '$total'
                };
                data.fields = [{field: '#ID'}, {field: 'Customer'},{field: 'Tel'}, {field: 'Address'},{field: 'Start Date'}, {field: 'End Date'}, {field: 'Status'}, {field: 'Total'}];
                data.displayFields = [{field: '_id'}, {field: 'customer'}, {field: 'telephone'},{field: 'address'}, {field: 'startDate'}, {field: 'endDate'}, {field: 'status'}, {field: 'total'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let groups = GroupInvoice.aggregate([
                {
                    $match: selector
                },

                {
                    $lookup: {
                        from: "pos_customers",
                        localField: "vendorOrCustomerId",
                        foreignField: "_id",
                        as: "customerDoc"
                    }
                },
                {$unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$invoices', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $addToSet: project
                        },
                        invoices: {
                            $addToSet: '$invoices'
                        }
                    }
                }, {
                    $sort: {_id: 1}
                }]);
            let total = GroupInvoice.aggregate([
                {
                    $match: selector
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$total'
                        }
                    }
                }]);
            if (groups.length > 0) {
                let sortData = _.sortBy(groups[0].data, '_id');
                groups[0].data = sortData;
                data.content = groups;
                data.footer.total = total[0].total;
            }
            return data
        }
    }
});
