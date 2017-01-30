import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder';
Meteor.methods({
    prepaidOrderShow({_id}){
        let prepaidOrder = PrepaidOrders.aggregate([
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
                $group: {
                    _id: '$_id',
                    items: {
                        $addToSet: {
                            itemName: '$itemDoc.name',
                            qty: '$items.qty',
                            price: '$items.price',
                            amount: '$items.amount',
                            remainQty: '$items.remainQty'
                        }
                    },
                    vendor: {$last: '$_vendor'},
                    branchId: {$last: '$branchId'},
                    prepaidOrderDate: {$last: '$prepaidOrderDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                    voucherId: {$last: '$voucherId'},
                    sumRemainQty: {$last: 'sumRemainQty'}
                }
            }
        ]);
        if(prepaidOrder.length > 0) {
            return prepaidOrder[0];
        }
        return {};
    }
});
