import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer';

Meteor.methods({
    loadMoreRingPull({branchId, status, pending}){
        return RingPullTransfers.find({toBranchId: branchId, pending: pending, status: status}).count();
    },
    lookupRingPull({doc}){
        let ringPull = RingPullTransfers.aggregate([
            {$match: {_id: doc._id}},
            {
                $lookup: {
                    from: "core_branch",
                    localField: "fromBranchId",
                    foreignField: "_id",
                    as: "_fromBranch"
                }
            },
            {
                $lookup: {
                    from: "core_branch",
                    localField: "toBranchId",
                    foreignField: "_id",
                    as: "_toBranch"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "fromUserId",
                    foreignField: "_id",
                    as: "_fromUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "toUserId",
                    foreignField: "_id",
                    as: "_toUser"
                }
            },
            {$unwind: {path: '$_fromBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
        ]);
        return ringPull[0];
    },
    ringPullTransferShowItems({_id}){
        let ringPullTransfer = RingPullTransfers.aggregate([
            {$match: {_id: _id}},
            {$unwind: {path: '$items', preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "pos_item",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "itemDoc"
                }
            },
            {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "core_branch",
                    localField: "fromBranchId",
                    foreignField: "_id",
                    as: "_fromBranch"
                }
            },
            {
                $lookup: {
                    from: "core_branch",
                    localField: "toBranchId",
                    foreignField: "_id",
                    as: "_toBranch"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "fromUserId",
                    foreignField: "_id",
                    as: "_fromUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "toUserId",
                    foreignField: "_id",
                    as: "_toUser"
                }
            },
            {
                $lookup: {
                    from: "pos_stockLocations",
                    localField: "stockLocationId",
                    foreignField: "_id",
                    as: "_stockLocation"
                }
            },
            {$unwind: {path: '$_fromBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_stockLocation', preserveNullAndEmptyArrays: true}},
            {
                $group: {
                    _id: '$_id',
                    items: {
                        $addToSet: {
                            itemName: '$itemDoc.name',
                            qty: '$items.qty',
                            price: '$items.price',
                            amount: '$items.amount',
                        }
                    },
                    pending: {$last: '$pending'},
                    _fromBranch: {$last: '$_fromBranch'},
                    _toBranch: {$last: '$_toBranch'},
                    _fromUser: {$last: '$_fromUser'},
                    _toUser: {$last: '$_toUser'},
                    _stockLocation: {$last: '$_stockLocation'},
                    branchId: {$last: '$branchId'},
                    ringPullTransferDate: {$last: '$ringPullTransferDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                }
            }
        ]);
        if (ringPullTransfer.length > 0) {
            return ringPullTransfer[0];
        }
        return {};
    }
});