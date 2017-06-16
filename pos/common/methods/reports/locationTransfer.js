import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {LocationTransfers} from '../../../imports/api/collections/locationTransfer';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const locationTransferMethods = new ValidatedMethod({
    name: 'pos.locationTransferReport',
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
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.locationTransferDate = {$gte: fromDate, $lte: toDate};
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
                            project['fromUser'] = '$_fromUser.username';
                            break;
                        case 'fromBranchId':
                            project['fromBranch'] = '$_fromBranch.enName';
                            break;
                        case 'fromStockLocationId':
                            project['fromStockLocation'] = '$_fromStockLocation.name';
                            break;
                        case 'toUserId':
                            project['toUser'] = '$_toUser.username';
                            break;
                        case 'toStockLocationId':
                            project['toStockLocation'] = '$_toStockLocation.name';
                            break;
                        case 'toBranchId':
                            project['toBranch'] = '$_toBranch.enName';
                            break;
                    }
                }
                data.fields.push({field: 'Total'}); //map total field for default
                data.displayFields.push({field: 'total'});
                project['total'] = '$total'; //get total projection for default
            } else { //default field
                project = {
                    '_id': '$_id',
                    'locationTransferDate': '$locationTransferDate',
                    'fromUser': '$_fromUser.username',
                    'fromBranch': '$_fromBranch.enName',
                    'fromStockLocation': '$_fromStockLocation.name',
                    'toUser': '$_toUser.username',
                    'toBranch': '$_toBranch.enName',
                    'toStockLocation': '$_toStockLocation.name',
                    'total': '$total'
                };
                data.fields = [
                    {field: '#ID'},
                    {field: 'Transfer Date'},
                    {field: 'From User'},
                    {field: 'From Branch'},
                    {field: 'From Location'},
                    {field: 'To User'},
                    {field: 'To Branch'},
                    {field: 'To Location'},
                    {field: 'Total'},
                ];
                data.displayFields = [
                    {field: '_id'},
                    {field: 'locationTransferDate'},
                    {field: 'fromUser'},
                    {field: 'fromBranch'},
                    {field: 'fromStockLocation'},
                    {field: 'toBranch'},
                    {field: 'toUser'},
                    {field: 'toStockLocation'},
                    {field: 'total'}
                ];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let locationTransfers = LocationTransfers.aggregate([
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
                 {
                    $lookup: {
                        from: "users",
                        localField: "toUserId",
                        foreignField: "_id",
                        as: "_toUser"
                    }
                }, {
                    $lookup: {
                        from: "users",
                        localField: "fromUserId",
                        foreignField: "_id",
                        as: "_fromUser"
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
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
                                itemName: '$itemDoc.name'
                            }
                        }
                    }
                }]);
            let total = LocationTransfers.aggregate(
                [
                    {
                        $match: selector
                    },
                    {$group: {_id: null, total: {$sum: '$total'}}}
                ]);
            if (locationTransfers.length > 0) {
                let sortData = _.sortBy(locationTransfers[0].data, '_id');
                locationTransfers[0].data = sortData
                data.content = locationTransfers;
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