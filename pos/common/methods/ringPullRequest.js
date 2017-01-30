import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer.js';
// Check user password
export const RingPullTransfersInfo = new ValidatedMethod({
    name: 'pos.ringPullTransfersInfo',
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
            let ringPullTransfers = RingPullTransfers.aggregate([
                {
                    $match: {_id: _id}
                },
                {
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
                            $last: {
                                _id: '$_id',
                                _stockLocation: '$stockDoc',
                                _fromUser: '$fromUserDoc',
                                _toUser: '$toUserDoc',
                                _fromBranch: '$fromBranchDoc',
                                _toBranch: '$toBranchDoc',
                                ringPullTransferDate: '$ringPullTransferDate',
                                pending: '$pending',
                                status: '$status',
                                total: '$total'
                            }
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
                }
            ]);
            return ringPullTransfers[0];
        }
    }
});
