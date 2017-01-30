import {CompanyExchangeRingPulls} from '../../imports/api/collections/companyExchangeRingPull';

Meteor.methods({
    companyExchangeRingPullShowItem({_id}){
        let companyExchangeRingPull = CompanyExchangeRingPulls.aggregate([
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
            {
                $lookup: {
                    from: "pos_stockLocations",
                    localField: "stockLocationId",
                    foreignField: "_id",
                    as: "stockLocation"
                }
            },
            {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$stockLocation', preserveNullAndEmptyArrays: true}},
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
                    companyExchangeRingPullDate: {$last: '$companyExchangeRingPullDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                    voucherId: {$last: '$voucherId'},
                    _stockLocation: {$last: '$stockLocation.name'},
                    sumRemainQty: {$last: 'sumRemainQty'}
                }
            }
        ]);
        if(companyExchangeRingPull.length > 0) {
            return companyExchangeRingPull[0];
        }
        return {};
    }
});