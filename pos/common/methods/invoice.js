import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
// Check user password
export const invoiceInfo = new ValidatedMethod({
    name: 'pos.invoiceInfo',
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
            console.log(_id);
            let invoice = Invoices.aggregate([{$match: {_id: _id}},{
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
                            invoiceDate: '$invoiceDate',
                            des: '$des',
                            customer: '$_customer.name',
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

            return invoice[0];
        }
    }
});
