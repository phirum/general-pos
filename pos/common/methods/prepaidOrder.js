import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {PrepaidOrders} from '../../imports/api/collections/prepaidOrder.js';
import {ReceiveItems} from '../../imports/api/collections/receiveItem';

// Check user password
export const PrepaidOrderInfo = new ValidatedMethod({
    name: 'pos.PrepaidOrderInfo',
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
            let prepaidOrder = PrepaidOrders.aggregate([{
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
            }, {
                $group: {
                    _id: '$_id',
                    data: {
                        $addToSet: {
                            _id: '$_id',
                            prepaidOrderDate: '$prepaidOrderDate',
                            des: '$des',
                            vendor: '$_vendor.name',
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

            return prepaidOrder[0];
        }
    }
});

export const removeItemInPrepaidOrder = new ValidatedMethod({
    name: 'pos.removeItemInPrepaidOrder',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        item: {type: Object}
    }).validator(),
    run({item}){
        if (!this.isSimulation) {
            PrepaidOrders.update({_id: item.prepaidOrderId, 'items.itemId': item.itemId},
                {
                    $pull: {'items.$.itemId': item.itemId},
                    $inc: {sumRemainQty: item.qty}
                })
        }
    }
});


export const updateItemInPrepaidOrder = new ValidatedMethod({
    name: 'pos.updateItemInPrepaidOrder',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        doc: {
            type: Object
        }
    }).validator(),
    run({doc}){
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            doc.items.forEach(function (item) {
                PrepaidOrders.direct.update(
                    {_id: doc.prepaidOrderId, 'item.itemId': item._id},
                    {$inc: {'item.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
                )
            });
        }
    }
});

export const isBillExist = new ValidatedMethod({
    name: 'pos.isBillExist',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}){
        if(!this.isSimulation) {
            let receiveItem = ReceiveItems.findOne({prepaidOrderId: _id});
            return {exist: receiveItem, _id: receiveItem && receiveItem._id ? receiveItem._id : ''};
        }
    }

});