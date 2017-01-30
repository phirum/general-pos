import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {ExchangeGratis} from '../../imports/api/collections/exchangeGratis.js';
import {EnterBills} from '../../imports/api/collections/enterBill.js';
// Check user password
export const ExchangeGratisInfo = new ValidatedMethod({
    name: 'pos.ExchangeGratisInfo',
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
            let exchangeGratis = ExchangeGratis.aggregate([{
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
                            exchangeGratisDate: '$exchangeGratisDate',
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

            return exchangeGratis[0];
        }
    }
});

export const removeItemInExchangeGratis = new ValidatedMethod({
    name: 'pos.removeItemInExchangeGratis',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        item: {type: Object}
    }).validator(),
    run({item}){
        if (!this.isSimulation) {
            ExchangeGratis.update({_id: item.exchangeGratisId, 'items.itemId': item.itemId},
                {
                    $pull: {'items.$.itemId': item.itemId},
                    $inc: {sumRemainQty: item.qty}
                })
        }
    }
});


export const updateItemInExchangeGratis = new ValidatedMethod({
    name: 'pos.updateItemInExchangeGratis',
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
                ExchangeGratis.direct.update(
                    {_id: doc.exchangeGratisId, 'item.itemId': item._id},
                    {$inc: {'item.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
                )
            });
        }
    }
});

/*
export const isBillExist = new ValidatedMethod({
    name: 'pos.isBillExist',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}){
        if(!this.isSimulation) {
            let bill = EnterBills.findOne({exchangeGratisId: _id});
            return {exist: bill, billId: bill && bill._id ? bill._id : ''};
        }
    }

});*/
