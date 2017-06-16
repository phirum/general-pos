import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull';
import {PrepaidOrders} from '../../../imports/api/collections/prepaidOrder';
import {LendingStocks} from '../../../imports/api/collections/lendingStock';
import {Item} from '../../../imports/api/collections/item';
import {Branch} from '../../../../core/imports/api/collections/branch';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const receiveItemBalanceReport = new ValidatedMethod({
    name: 'pos.companyExchangeRingPull',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let itemSelector = [];
            let selector = {};
            let subOneMonth;
            let receiveCollection;
            let data = {
                title: {item: 'All'},
                fields: [],
                displayFields: [],
                content: [],
                footer: {}
            };
            let branch = [];

            if (params.itemId) {
                let concatItem = '';
                itemSelector = params.itemId.split(',');
                let items = Item.find({_id: {$in: params.itemId.split(',')}});
                items.forEach(function (item) {
                    concatItem += `${item.name}, `;
                });
                data.title.item = concatItem;
            } else {
                itemSelector['items.itemId'] = {$exists: true}
            }
            let startOfMonth;
            let endOfMonth;
            if (params.receiveType) {
                selector[params.receiveType] = {};
                let firstLetter = _.capitalize(params.receiveType.substr(0, 1));
                let afterFirstLetter = params.receiveType.substr(1, params.receiveType.length);
                receiveCollection = eval(firstLetter + afterFirstLetter + 's');
            } else {
                return data;
            }
            if (params.branchId) {
                selector[params.receiveType].branchId = params.branchId;
            } else {
                return data;
            }
            let toDate;
            if (params.asDate) {
                toDate = moment(params.asDate).endOf('days').toDate();
                startOfMonth = moment(params.asDate).startOf('months').toDate();
                endOfMonth = moment(params.asDate).endOf('months').toDate();
                subOneMonth = moment(params.asDate).subtract(1, 'months').endOf('months').toDate();
                data.title.branch = Branch.findOne({_id: params.branchId});
                data.title.date = moment(toDate).format('DD/MM/YYYY');
                data.title.type = getType(params.receiveType);
                selector[params.receiveType][`${params.receiveType}` + 'Date'] = {$lte: toDate};
                selector[params.receiveType].status = {$ne: 'closed'};
            } else {
                return data;
            }
            let lookupItem = {};
            let items = [];
            let totalRemainQty = 0;
            let totalQty = 0;
            let totalReceiveQty = 0;
            let totalAmount = 0;
            let collections = receiveCollection.aggregate([
                {
                    $match: selector[params.receiveType]
                },
                {
                    $lookup: {
                        from: "pos_receiveItems",
                        localField: "_id",
                        foreignField: `${params.receiveType}Id`,
                        as: "receiveDocs"
                    }
                },
                {
                    $project: {
                        items: 1,
                        receiveDocs: {
                            $filter: {
                                input: '$receiveDocs',
                                as: 'doc',
                                cond: {
                                    $lte: [`$$doc.${params.receiveType}Date`, toDate]
                                }
                            }
                        }
                    }
                }
            ]);
            collections.forEach(function (doc) {
                doc.items.forEach(function (item) {
                    if (_.isUndefined(lookupItem[item.itemId])) {
                        lookupItem[item.itemId] = {
                            itemId: item.itemId,
                            itemDoc: Item.findOne(item.itemId),
                            price: item.price,
                            totalQty: item.qty,
                            receiveQty: 0,
                            remainQty: item.qty,
                        }
                    } else {
                        lookupItem[item.itemId].totalQty += item.qty;
                        lookupItem[item.itemId].remainQty += item.qty;

                    }
                });
                doc.receiveDocs.forEach(function (receiveDoc) {
                    receiveDoc.items.forEach(function (item) {
                        lookupItem[item.itemId].receiveQty += item.qty;
                        lookupItem[item.itemId].remainQty = lookupItem[item.itemId].totalQty - item.qty;
                    });
                });
            });
            for (let k in lookupItem) {
                if(itemSelector.length > 0 && _.includes(itemSelector, k) || itemSelector.length <= 0) {
                    lookupItem[k].amount = lookupItem[k].remainQty * lookupItem[k].price;
                    totalQty += lookupItem[k].totalQty;
                    totalRemainQty += lookupItem[k].remainQty;
                    totalReceiveQty += lookupItem[k].receiveQty;
                    totalAmount += lookupItem[k].amount;
                    items.push(lookupItem[k]);
                }
            }
            if (items.length > 0) {
                data.content = items.sort(compareName);
            }
            data.footer = {
                totalQty,
                totalRemainQty,
                totalReceiveQty,
                totalAmount
            };
            return data;
        }
    }
});
function compareId(a, b) {
    if (a._id < b._id)
        return -1;
    if (a._id > b._id)
        return 1;
    return 0;
}
function compare(a, b) {
    let aDate = moment(a.date).format('YYYY-MM-DD HH:mm:ss');
    let bDate = moment(b.date).format('YYYYY-MM-DD HH:mm:ss');
    if (moment(aDate).isAfter(bDate)) {
        return -1;
    }
    if (moment(aDate).isBefore(bDate)) {
        return 1;
    }
    return 0;
}
function compareName(a, b) {
    if (a.itemDoc.name < b.itemDoc.name)
        return -1;
    if (a.itemDoc.name > b.itemDoc.name)
        return 1;
    return 0;
}
function calcBalance(doc) {
    let balance = 0;
    doc.forEach(function (item) {
        if (item.type == 'in') {
            balance += (item.exchangeRP + item.receiveTransfer)
        } else {
            balance -= (item.cExchangeRP + item.transferRP);
        }
    });
    return balance;
}
function aggMatchingDate(startofMonth, endOfMonth, condField, tokenField) {
    return {
        $cond: [
            {
                $and: [
                    {$gte: [condField, startofMonth]},
                    {$lte: [condField, endOfMonth]}
                ]
            },
            tokenField,
            0
        ]
    }
}
function getType(type) {
    if(type == 'companyExchangeRingPull') {
        return 'Company Exchange RingPull'
    }else if (type == 'lendingStock') {
        return 'Lending Stock'
    }
    return 'Prepaid Order';
}