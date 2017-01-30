import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem';
;
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
export const receiveItemSummary = new ValidatedMethod({
    name: 'pos.receiveItemSummaryFn',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branch = [];
            let user = Meteor.users.findOne(Meteor.userId());
            let exchange = Exchange.findOne({}, {sort: {_id: -1}});
            let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$total'})
            let fromDate, toDate;
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                let dateAsArray = params.date.split(',');
                fromDate = moment(dateAsArray[0]).toDate();
                toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
            }
            if (params.type && params.type != '') {
                selector.type = {$in: params.type.split(',')};
                selector.receiveItemDate = {$gte: fromDate, $lte: toDate};
            } else {
                selector.receiveItemDate = {$gte: fromDate, $lte: toDate}
            }
            if (params.status) {
                selector.status = {$in: params.status.split(',')};
            }
            data.title.status = params.status || "All";
            // project['$invoice'] = 'Invoice';
            /****** Title *****/
            data.title.company = Company.findOne();
            /****** Content *****/
            let receiveItems = ReceiveItems.aggregate([
                {$match: selector},
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
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                  $project: {
                      type: 1,
                      itemDoc: 1,
                      items: {
                          lostQty: 1,
                          qty: 1,
                          totalQty: {$add: ['$items.qty', '$items.lostQty']},
                          itemId: 1,
                          price: 1,
                          amount: 1,
                      }

                  }
                },
                {
                    $group: {
                        _id: {
                            type: '$type',
                            itemId: '$items.itemId'
                        },
                        itemDoc: {
                            $last: '$itemDoc'
                        },
                        lostQty: {
                          $sum: '$items.lostQty',
                        },
                        totalQty: {
                          $sum: '$items.totalQty'
                        },
                        itemQty: {
                            $sum: '$items.qty'
                        },
                        itemPrice: {
                            $avg: '$items.price'
                        },
                        itemAmount: {
                            $sum: '$items.amount'
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id.type',
                        items: {
                            $addToSet: {
                                itemName: '$itemDoc.name',
                                remainQty: '$itemQty',
                                totalQty: '$totalQty',
                                lostQty: '$lostQty',
                                price: '$itemPrice',
                                totalAmount: '$itemAmount'
                            }
                        },
                        total: {$sum: '$itemAmount'}
                    }
                },
                {$sort: {_id: 1}},
                {
                    $group: {
                        _id: null,
                        data: {$addToSet: '$$ROOT'},
                        total: {$sum: '$total'}
                    }
                }]);
            if (receiveItems.length > 0) {
                data.content = receiveItems[0].data;
                data.footer.total = receiveItems[0].total;
            }
            return data;
        }
    }
});
