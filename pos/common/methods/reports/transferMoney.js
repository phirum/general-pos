import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {TransferMoney} from '../../../imports/api/collections/transferMoney';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const transferMoneyMethod = new ValidatedMethod({
    name: 'pos.transferMoneyMethod',
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
                content: [],
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
                selector.transferMoneyDate = {$gte: fromDate, $lte: toDate};
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
                        case 'toUserId':
                            project['toUser'] = '$_toUser.username';
                            break;
                        case 'toBranchId':
                            project['toBranch'] = '$_toBranch.enName';
                            break;
                    }
                }
                data.fields.push({field: 'Transfer Amount'}); //map total field for default
                data.displayFields.push({field: 'transferAmount'});
                project['transferAmount'] = '$transferAmount'; //get total projection for default
            } else { //default field
                project = {
                    '_id': '$_id',
                    'transferMoneyDate': '$transferMoneyDate',
                    'fromUser': '$_fromUser.username',
                    'fromBranch': '$_fromBranch.enName',
                    'toBranch': '$_toBranch.enName',
                    'toUser': '$_toUser.username',
                    'transferAmount': '$transferAmount'
                };
                data.fields = [
                    {field: '#ID'},
                    {field: 'Transfer Date'},
                    {field: 'From User'},
                    {field: 'From Branch'},
                    {field: 'To Branch'},
                    {field: 'To User'},
                    {field: 'Transfer Amount'},
                ];
                data.displayFields = [
                    {field: '_id'},
                    {field: 'transferMoneyDate'},
                    {field: 'fromUser'},
                    {field: 'fromBranch'},
                    {field: 'toBranch'},
                    {field: 'toUser'},
                    {field: 'transferAmount'}
                ];
            }

            /****** Content *****/
            let transferMoneys = TransferMoney.aggregate([
                {
                    $match: selector
                },
                {$sort: {_id: 1}},
                {
                    $lookup: {
                        from: 'users',
                        localField: 'fromUserId',
                        foreignField: '_Id',
                        as: '_fromUser'
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'toUserId',
                        foreignField: '_Id',
                        as: '_toUser'
                    }
                },
                {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: project
                        },
                        totalTransferAmount: {$sum: '$transferAmount'}
                    }
                },

            ]);
            /****** Title *****/
            if (transferMoneys.length > 0) {
                data.content = transferMoneys[0].data;
                data.footer.totalTransferAmount = transferMoneys[0].totalTransferAmount;
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