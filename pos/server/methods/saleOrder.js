import {Order} from '../../imports/api/collections/order';
Meteor.methods({
    saleOrderShow({_id}){
        let order = Order.aggregate([
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
                    customer: {$last: '$_customer'},
                    branchId: {$last: '$branchId'},
                    orderDate: {$last: '$orderDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                    voucherId: {$last: '$voucherId'},
                    sumRemainQty: {$last: 'sumRemainQty'}
                }
            }
        ]);
        if(order.length > 0) {
            return order[0];
        }
        return {};
    }
});