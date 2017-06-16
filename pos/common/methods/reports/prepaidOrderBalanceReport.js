import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {PrepaidOrders} from '../../../imports/api/collections/prepaidOrder';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import ReportFn from '../../../imports/api/libs/report';
export const prepaidOrderBalanceReport = new ValidatedMethod({
    name: 'pos.prepaidOrderBalanceReport',
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
            let branchId = [];
            if(params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.status = {$in: ['active', 'closed']};
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.prepaidOrderDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.vendor && params.vendor != '') {
                selector.vendorId = params.vendor;
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
                    'prepaidOrderDate': '$prepaidOrderDate',
                    'vendor': '$_vendor.name',
                    'status': '$status',
                    'sumRemainQty': '$sumRemainQty',
                    'total': '$total',
                    'items': '$items'
                };
                data.fields = [{field: '#ID'}, {field: 'Date'}, {field: 'Vendor'}, {field: 'Status'}, {field: 'Remain Qty'}, {field: 'Total'}];
                data.displayFields = [{field: '_id'}, {field: 'prepaidOrderBalanceDate'}, {field: 'vendor'}, {field: 'status'}, {field: 'sumRemainQty'}, {field: 'total'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let prepaidOrderBalances = PrepaidOrders.aggregate([
                {
                    $match: selector
                }, {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true},

                }, {
                    $lookup: {
                        from: "pos_item",
                        localField: "items.itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $addToSet: project
                        },
                        items: {
                            $addToSet: {
                                qty: '$items.qty',
                                price: '$items.price',
                                amount: '$items.amount',
                                itemId: '$items.itemId',
                                itemName: '$itemDoc.name',
                                remainQty: '$items.remainQty',
                            }
                        }
                    }
                }]);
            let total = PrepaidOrders.aggregate(
                [
                    {
                        $match: selector
                    },
                    {
                        $group: {
                            _id: null, total: {$sum: '$total'},
                            totalRemainQty: {$sum: '$sumRemainQty'}
                        }
                    }
                ]);
            console.log(prepaidOrderBalances);
            if (prepaidOrderBalances.length > 0) {
                let sortData = _.sortBy(prepaidOrderBalances[0].data, '_id');
                prepaidOrderBalances[0].data = sortData;
                data.content = prepaidOrderBalances;
                data.footer.total = total[0].total;
                data.footer.totalRemainQty = total[0].totalRemainQty
            }
            return data
        }
    }
});
