import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer.js';
// Check user password
export const LocationTransferInfo = new ValidatedMethod({
    name: 'pos.locationTransferInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {
            type: String
        }
    }).validator(),
    run({
        _id
    }) {
        if (!this.isSimulation) {
            let locationTransfer = LocationTransfers.aggregate([{$match: {_id: _id}}, {
                $unwind: '$items'
            }, {
                $lookup: {
                    from: "pos_item",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "fItems"
                }
            }, {
                $unwind: '$fItems'
            },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'toUserId',
                        foreignField: '_id',
                        as: '_toUser'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'fromUserId',
                        foreignField: '_id',
                        as: '_fromUser'
                    }
                },
                {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $addToSet: {
                                _id: '$_id',
                                _fromStockLocation: '$_fromStockLocation',
                                _fromUser: '$_fromUser',
                                _toUser: '$_toUser',
                                _fromBranch: '$_fromBranch',
                                _toBranch: '$_toBranch',
                                _toStockLocation: '$_toStockLocation',
                                locationTransferDate: '$locationTransferDate',
                                pending: '$pending',
                                status: '$status',
                                total: '$total'
                            }
                        },
                        items: {
                            $addToSet: {
                                itemId: '$items.itemId',
                                name: '$fItems.name',
                                qty: '$items.qty',
                                price: '$items.price',
                                amount: '$items.amount',
                            }
                        }
                    }
                }, {
                    $unwind: '$data'
                }]);
            return locationTransfer[0];
        }
    }
});
