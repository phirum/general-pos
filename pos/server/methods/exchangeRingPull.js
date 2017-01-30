import {ExchangeRingPulls} from '../../imports/api/collections/exchangeRingPull';
Meteor.methods({
    exchangeRingPullShow({_id}){
        let exchangeRingPull = ExchangeRingPulls.aggregate([
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
                        }
                    },
                    customer: {$last: '$_customer'},
                    branchId: {$last: '$branchId'},
                    exchangeRingPullDate: {$last: '$exchangeRingPullDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                }
            }
        ]);
        if (exchangeRingPull.length > 0) {
            return exchangeRingPull[0];
        }
        return {};
    }
});