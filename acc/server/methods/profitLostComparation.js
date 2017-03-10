import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Journal} from '../../imports/api/collections/journal';

import {Exchange} from '../../../core/imports/api/collections/exchange';
import {CloseChartAccount} from '../../imports/api/collections/closeChartAccount';
import {ChartAccount} from '../../imports/api/collections/chartAccount';

Meteor.methods({
    getProfitLostComparation: function (selector, showNonActive, baseCurrency, month, year, exchangeId) {


        selector['transaction.accountDoc.accountTypeId'] = {$in: ['40', '41','50', '51','60']};

        let exchange = Exchange.findOne({_id: exchangeId});
        let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$transaction.drcr', baseCurrency});

        var result = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: selector
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1,
                        account: "$transaction.accountDoc._id",
                        code: "$transaction.accountDoc.code",
                        name: "$transaction.accountDoc.name",
                        accountTypeId: "$transaction.accountDoc.accountTypeId",
                        level: "$transaction.accountDoc.level",
                        parent: "$transaction.accountDoc.parentId"

                    },
                    journalDate: 1,
                    value: {
                        $cond: {
                            if: {$eq: ['$currencyId', 'USD']},
                            then: coefficient.USD,
                            else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficient.KHR, coefficient.THB]}
                        }
                    }

                }
            },

            {
                $group: {
                    _id: {
                        month: "$month",
                        year: "$year",
                        account: "$transaction.account",
                        code: "$transaction.code",
                        name: "$transaction.name",
                        accountTypeId: "$transaction.accountTypeId",
                        level: "$transaction.level",
                        parent: "$transaction.parent"

                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$value'}
                }
            },
            {$sort: {journalDate: -1}}

        ]);


        if (showNonActive == 'true' || showNonActive == true) {
            var accountParent = ChartAccount.find({
                accountTypeId: {$in: ['40', '41','50', '51','60']},
                level: {$gt: 0}
            }).fetch().map(function (obj) {
                return obj.parentId;
            });
            ChartAccount.find({
                accountTypeId: {$in: ['40', '41','50', '51','60']},
                _id: {$nin: accountParent}
            }).fetch().forEach(function (obj) {
                if (obj) {
                    result.push({
                        _id: {
                            month: month,
                            year: year,
                            currencyId: baseCurrency,
                            account: obj._id,
                            code: obj.code,
                            name: obj.name,
                            accountTypeId: obj.accountTypeId,
                            level: obj.level,
                            parent: obj.parentId
                        }
                        ,
                        journalDate: "",
                        value: 0

                    });
                }
            })
        }
        return result;
    },


    getIncomeGroupByMonth: function (selector, baseCurrency, exchangeId) {

        selector['transaction.accountDoc.accountTypeId'] = {$in: ['40', '41']};


        let exchange = Exchange.findOne({_id: exchangeId});
        let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$transaction.drcr', baseCurrency});

        var result = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: selector
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1
                    },
                    journalDate: 1,
                    accountType: {
                        $cond: [
                            {
                                $or: [
                                    {$eq: ["$transaction.accountDoc.accountTypeId", "40"]},
                                    {$eq: ["$transaction.accountDoc.accountTypeId", '41']}
                                ]
                            }, "Income", "Expense"]
                    }
                    ,
                    value: {
                        $cond: {
                            if: {$eq: ['$currencyId', 'USD']},
                            then: coefficient.USD,
                            else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficient.KHR, coefficient.THB]}
                        }
                    }


                }
            },
            {
                $group: {
                    _id: {
                        month: "$month",
                        year: "$year",
                        accountType: "$accountType"
                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$value'}
                }
            },
            {$sort: {journalDate: -1}}

        ]);


        return result;
    },
    getExpenseGroupByMonth: function (selector, baseCurrency, exchangeId) {
        selector['transaction.accountDoc.accountTypeId'] = {$in: ['50', '51']};


        let exchange = Exchange.findOne({_id: exchangeId});
        let coefficient = exchangeCoefficient({exchange, fieldToCalculate: '$transaction.drcr', baseCurrency});

        var result = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: selector
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1
                    },
                    journalDate: 1,
                    accountType: {
                        $cond: [
                            {
                                $or: [
                                    {$eq: ["$transaction.accountDoc.accountTypeId", "40"]},
                                    {$eq: ["$transaction.accountDoc.accountTypeId", '41']}
                                ]
                            }, "Income", "Expense"]
                    },
                    value: {
                        $cond: {
                            if: {$eq: ['$currencyId', 'USD']},
                            then: coefficient.USD,
                            else: {$cond: [{$eq: ['$currencyId', 'KHR']}, coefficient.KHR, coefficient.THB]}
                        }
                    }


                }
            },
            {
                $group: {
                    _id: {
                        month: "$month",
                        year: "$year",
                        accountType: "$accountType"
                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$value'}
                }
            },
            {$sort: {journalDate: -1}}

        ]);


        return result;
    }
})


let exchangeCoefficient = function ({exchange, fieldToCalculate, baseCurrency}) {
    let coefficient = {
        KHR: {},
        THB: {},
        USD: {}
    };
    if (baseCurrency == 'USD') {
        coefficient.KHR.$divide = [fieldToCalculate, exchange.rates.KHR];
        coefficient.THB.$divide = [fieldToCalculate, exchange.rates.THB];
        coefficient.USD.$multiply = [fieldToCalculate, 1];
    } else if (baseCurrency == 'THB') {
        coefficient.KHR.$divide = [fieldToCalculate, exchange.rates.KHR];
        coefficient.USD.$divide = [fieldToCalculate, exchange.rates.USD];
        coefficient.THB.$multiply = [fieldToCalculate, 1];
    } else {
        coefficient.THB.$multiply = [fieldToCalculate, exchange.rates.THB];
        coefficient.USD.$multiply = [fieldToCalculate, exchange.rates.USD];
        coefficient.KHR.$multiply = [fieldToCalculate, 1];
    }
    return coefficient;
};





