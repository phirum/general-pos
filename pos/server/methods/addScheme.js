import {Meteor} from 'meteor/meteor';
import {Item} from '../../imports/api/collections/item';
Meteor.methods({
    addScheme({itemId}){
        let item = Item.aggregate([{
            $match: {_id: itemId}
        }, {
            $unwind: {
                path: '$scheme',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: 'pos_item',
                localField: 'scheme.itemId',
                foreignField: '_id',
                as: 'itemDoc'
            }
        }, {
            $unwind: {
                path: '$itemDoc',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $group: {
                _id: '$_id',
                scheme: {
                    $addToSet:{
                        itemId: '$itemDoc._id',
                        itemName: '$itemDoc.name',
                        price: '$scheme.price',
                        quantity: '$scheme.quantity'
                    }
                }
            }
        }]);
        return item[0].scheme;
    },
    /*addSchemeOnlyQty({itemId}){
        let item = Item.aggregate([{
            $match: {_id: itemId}
        }, {
            $unwind: {
                path: '$scheme',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $lookup: {
                from: 'pos_item',
                localField: 'scheme.itemId',
                foreignField: '_id',
                as: 'itemDoc'
            }
        }, {
            $unwind: {
                path: '$itemDoc',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $group: {
                _id: '$_id',
                scheme: {
                    $addToSet:{
                        itemId: '$itemDoc._id',
                        itemName: '$itemDoc.name',
                       // price: '$scheme.price',
                        quantity: '$scheme.quantity'
                    }
                }
            }
        }]);
        return item[0].scheme;
    }*/
});