import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {RingPullTransfers} from '../../../imports/api/collections/ringPullTransfer';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const ringPullTransferMethods = new ValidatedMethod({
    name: 'pos.ringPullTransferMethods',
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
            // selector.status = {$in: ['decline', 'closed', 'closed']};
            if (params.fromBranch) {
                selector.fromBranchId = params.fromBranch;
            }
            if (params.toBranch) {
                selector.toBranchId = params.toBranch;
            }
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).startOf('days').toDate();
                let toDate = moment(dateAsArray[1]).endOf('days').toDate();
                data.title.date = moment(fromDate).format('DD/MM/YYYY') + ' - ' + moment(toDate).format('DD/MM/YYYY');
                selector.ringPullTransferDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.status) {
                selector.status = {$in: params.status.split(',')}
            }
            if (params.filter && params.filter != '') { //dynamic field
                let filters = params.filter.split(','); //map specific field
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: correctDisplayField(filters[i])});
                    project[filters[i]] = `$${filters[i]}`;
                    switch (filters[i]) {
                        case 'fromUserId':
                            project['fromUser'] = '$fromUserDoc.username';
                            break;
                        case 'fromBranchId':
                            project['fromBranch'] = '$fromBranchDoc.enName';
                            break;
                        // case 'fromStockLocationId':
                        //     project['fromStockLocation'] = '$_fromStockLocation.name';
                        //     break;
                        case 'toUserId':
                            project['toUser'] = '$toUserDoc.username';
                            break;
                        // case 'toStockLocationId':
                        //     project['toStockLocation'] = '$_toStockLocation.name';
                        //     break;
                        case 'toBranchId':
                            project['toBranch'] = '$toBranchDoc.enName';
                            break;
                    }
                }
                /*   data.fields.push({field: 'Total'}); //map total field for default
                 data.displayFields.push({field: 'total'});
                 project['total'] = '$total';*/ //get total projection for default
            } else { //default field
                project = {
                    '_id': '$_id',
                    'ringPullTransferDate': '$ringPullTransferDate',
                    'fromUser': '$fromUserDoc.username',
                    'fromBranch': '$fromBranchDoc.enName',
                    // 'fromStockLocation': '$_fromStockLocation.name',
                    'toBranch': '$toBranchDoc.enName',
                    'toUser': '$toUserDoc.username',
                    // 'toStockLocation': '$_toStockLocation.name',
                };
                data.fields = [
                    {field: '#ID'},
                    {field: 'Transfer Date'},
                    {field: 'From User'},
                    {field: 'From Branch'},
                    // {field: 'From Location'},
                    {field: 'To Branch'},
                    {field: 'To User'},
                    // {field: 'To Location'},
                ];
                data.displayFields = [
                    {field: '_id'},
                    {field: 'ringPullTransferDate'},
                    {field: 'fromUser'},
                    {field: 'fromBranch'},
                    // {field: 'fromStockLocation'},
                    {field: 'toBranch'},
                    {field: 'toUser'},
                    // {field: 'toStockLocation'},
                ];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let ringPullTransfers = RingPullTransfers.aggregate([
                {
                    $match: selector
                }, {
                    $unwind: {path: '$items'}
                },
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "items.itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {
                    $lookup: {
                        from: "core_branch",
                        localField: "fromBranchId",
                        foreignField: "_id",
                        as: "fromBranchDoc"
                    }
                },
                {
                    $lookup: {
                        from: "core_branch",
                        localField: "toBranchId",
                        foreignField: "_id",
                        as: "toBranchDoc"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "fromUserId",
                        foreignField: "_id",
                        as: "fromUserDoc"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "toUserId",
                        foreignField: "_id",
                        as: "toUserDoc"
                    }
                },
                {
                    $lookup: {
                        from: "pos_stockLocations",
                        localField: "stockLocationId",
                        foreignField: "_id",
                        as: "stockDoc"
                    }
                },
                {
                    $unwind: {path: '$stockDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$fromBranchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$toBranchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$fromUserDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$toUserDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $addToSet: project
                        },
                        items: {
                            $addToSet: {
                                itemId: '$items.itemId',
                                name: '$itemDoc.name',
                                qty: '$items.qty',
                                price: '$items.price',
                                amount: '$items.amount',
                            }
                        }
                    }
                }]);
            let total = RingPullTransfers.aggregate(
                [
                    {
                        $match: selector
                    },
                    {$group: {_id: null, total: {$sum: '$total'}}}
                ]);
            if (ringPullTransfers.length > 0) {
                let sortData = _.sortBy(ringPullTransfers[0].data, '_id');
                ringPullTransfers[0].data = sortData
                data.content = ringPullTransfers;
                data.footer.total = total[0].total;
            }
            return data
        }
    }
});


function correctDisplayField(field) {
    let label = field;
    switch (field) {
        case 'fromUserId':
            label = 'fromUser';
            break;
        case 'fromBranchId':
            label = 'fromBranch';
            break;
        case 'fromStockLocationId':
            label = 'fromStockLocation';
            break;
        case 'toUserId':
            label = 'toUser';
            break;
        case 'toStockLocationId':
            label = 'toStockLocation';
            break;
        case 'toBranchId':
            label = 'toBranch';
            break;
    }
    return label;
}