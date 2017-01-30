import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {NetInCome} from '../../../imports/api/collections/netIncome';
import {Journal} from '../../../imports/api/collections/journal';
import {CloseChartAccount} from '../../../imports/api/collections/closeChartAccount';
import {CloseChartAccountPerMonth} from '../../../imports/api/collections/closeChartAccountPerMonth';
import {ChartAccount} from '../../../imports/api/collections/chartAccount';

Meteor.methods({
    chart_netIncome(param){
        var currentDate = moment().toDate;

        var dataMain = {};
        var data = [];
        var monthList = [];
        var valueList = [];

        var selector = {};
        selector.year = param.year;
        selector.branchId = param.branchId;

        var arr = [];
        for (let i = 1; i < 13; i++) {
            let monthNumber = s.pad(i, 2, "0");
            selector.month = monthNumber;

            monthList.push(getMonthName(i));

            var netIncome = NetInCome.find(selector).fetch();
            if (netIncome.length > 0) {
                netIncome.forEach((obj) => {
                    if (param.currency == "usd") {
                        valueList.push(obj.dollar)
                    } else if (param.currency == "khr") {
                        valueList.push(obj.riel)
                    } else if (param.currency == "baht") {
                        valueList.push(obj.baht)
                    }
                })
            } else {
                valueList.push(0);
            }
        }

        data.push({
            type: 'column',
            data: valueList,
            name: "Net Income"
        })

        dataMain.data = data;
        dataMain.monthList = monthList;
        return dataMain;

    }
    , chart_dailyIncomeExpense(branchId){
        let data = {};

        var currentDate = moment().toDate();

        let curMonth = moment(currentDate).month();
        let curYear = moment(currentDate).year();

        let month = curMonth + 1;
        let startDate = moment('01-' + month + '-' + curYear, "DD/MM/YYYY").toDate();


        let dataIncome = [
            {_id: 'USD', dayList: [], value: []},
            {_id: 'KHR', dayList: [], value: []},
            {_id: 'THB', dayList: [], value: []}]

        let dataExpense = [
            {_id: 'USD', dayList: [], value: []},
            {_id: 'KHR', dayList: [], value: []},
            {_id: 'THB', dayList: [], value: []}]


        var dataIncomeOrg = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: {
                'transaction.accountDoc.accountTypeId': {$in: ['40', '41']},
                journalDate: {$gte: startDate},
                branchId: branchId
            }
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    day: {$dayOfMonth: "$journalDate"},
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1
                    },
                    journalDate: 1,

                }
            },
            {
                $group: {
                    _id: {
                        day: "$day",
                        month: "$month",
                        year: "$year",
                        currencyId: "$currencyId",

                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$transaction.drcr'}
                }
            },
            {$sort: {journalDate: -1}},
            {
                $group: {
                    _id: "$_id.currencyId",
                    dayList: {
                        $addToSet: {$dateToString: {format: "%d/%m/%Y", date: "$journalDate"}}
                    },
                    value: {
                        $addToSet: {$multiply: ["$value", -1]}
                    }

                }
            }

        ]);


        dataIncomeOrg.forEach(function (obj) {
            for (var i = 0; i < dataIncome.length; i++) {
                if (dataIncome[i]._id === obj._id) {
                    dataIncome[i].dayList = obj.dayList;
                    dataIncome[i].value = obj.value;
                    break;
                }
            }
        })

        var dayList = getDaysInMonth(curMonth, curYear);
        dayList.forEach(function (obj) {
            dataIncome.forEach(function (doc) {
                if (doc._id == "KHR") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                } else if (doc._id == "USD") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                } else if (doc._id == "THB") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                }
            })
        })


        var dataExpenseOrg = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: {
                'transaction.accountDoc.accountTypeId': {$in: ['50', '51']},
                journalDate: {$gte: startDate},
                branchId: branchId
            }
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    day: {$dayOfMonth: "$journalDate"},
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1
                    },
                    journalDate: 1,

                }
            },
            {
                $group: {
                    _id: {
                        day: "$day",
                        month: "$month",
                        year: "$year",
                        currencyId: "$currencyId",

                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$transaction.drcr'}
                }
            },
            {$sort: {journalDate: -1}},
            {
                $group: {
                    _id: "$_id.currencyId",
                    dayList: {
                        $addToSet: {$dateToString: {format: "%d/%m/%Y", date: "$journalDate"}}
                    },
                    value: {
                        $addToSet: "$value"
                    }

                }
            }

        ]);

        dataExpenseOrg.forEach(function (obj) {
            for (var i = 0; i < dataExpense.length; i++) {
                if (dataExpense[i]._id === obj._id) {
                    dataExpense[i].dayList = obj.dayList;
                    dataExpense[i].value = obj.value;
                    break;
                }
            }
        })


        dayList.forEach(function (obj) {
            dataExpense.forEach(function (doc) {
                if (doc._id == "KHR") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                } else if (doc._id == "USD") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                } else if (doc._id == "THB") {
                    if (doc.dayList.indexOf(moment(obj).format("DD/MM/YYYY")) == -1) {
                        let index = dayList.indexOf(obj);
                        doc.dayList.splice(index, 0, moment(obj).format("DD/MM/YYYY"));
                        doc.value.splice(index, 0, 0);
                    }
                }
            })
        })


        data.dataIncome = dataIncome;
        data.dataExpense = dataExpense;

        return data;

    }
    , chart_accountEveryMonth: function (selector) {
        let dataMain = {};
        let data = [];
        let chartAccountList = [];
        var chartAccount = ChartAccount.find({accountTypeId: "40"}).fetch();
        for (let i = 1; i < 13; i++) {
            let monthNumber = s.pad(i, 2, "0");
            let valueAccountList = [];
            chartAccount.forEach(function (account) {
                if (i == 1) {
                    chartAccountList.push(account.code + " | " + account.name);
                }
                selector.closeChartAccountId = account._id;


                selector.month = monthNumber;
                var closeChartAccount = CloseChartAccountPerMonth.findOne(selector);
                if (closeChartAccount != undefined) {
                    if (["20", "21", "30", "40", "41"].indexOf(closeChartAccount.accountTypeId) > -1) {
                        valueAccountList.push(numeral().unformat(numeral(-1 * closeChartAccount.value).format('(0,0.00)')));
                    } else {
                        valueAccountList.push(numeral().unformat(numeral(closeChartAccount.value).format('(0,0.00)')));
                    }
                } else {
                    valueAccountList.push(0);
                }
            })
            let monthName = getMonthName(i);
            data.push({
                type: 'line',
                data: valueAccountList,
                name: monthName
            })
        }
        dataMain.chartAccountList = chartAccountList;
        dataMain.data = data;
        return dataMain;
    }
    , chart_accountEveryMonthCombination: function (selector, accountTypeId) {
        let dataMain = {};
        let data = [];
        let monthList = [];
        var chartAccount = ChartAccount.find({accountTypeId: accountTypeId}).fetch();
        let j = 1;
        chartAccount.forEach(function (account) {
            let valueAccountList = [];
            selector.closeChartAccountId = account._id;

            for (let i = 1; i < 13; i++) {
                if (j == 1) {
                    monthList.push(getMonthName(i));
                }


                let monthNumber = s.pad(i, 2, "0");
                selector.month = monthNumber;
                var closeChartAccount = CloseChartAccountPerMonth.findOne(selector);
                if (closeChartAccount != undefined) {
                    if (["20", "21", "30", "40", "41"].indexOf(closeChartAccount.accountTypeId) > -1) {
                        valueAccountList.push(numeral().unformat(numeral(-1 * closeChartAccount.value).format('(0,0.00)')));
                    } else {
                        valueAccountList.push(numeral().unformat(numeral(closeChartAccount.value).format('(0,0.00)')));
                    }
                } else {
                    valueAccountList.push(0);
                }

            }
            j++;
            data.push({
                type: 'line',
                data: valueAccountList,
                name: account.code + " | " + account.name
            })

        })
        dataMain.xData = monthList;
        dataMain.datasets = data;
        return dataMain;
    }
    ,

    chart_companySnapshot: function (selector) {

        let thisSelector = {};
        let valueAccountListIncome = [];
        let accountListIncome = [];

        let valueAccountListExpense = [];
        let accountListExpense = [];

        let data = {};
        let dataIncome = [];
        let dataExpense = [];


        thisSelector.accountTypeId = {$in: ['40', '41', '50', '51']}
        thisSelector.year = selector.year;
        // thisSelector.month = selector.year;
        thisSelector.currencyId = selector.currencyId;
        thisSelector.month = selector.month;

        let amountList = CloseChartAccountPerMonth.find(thisSelector).fetch();


        amountList.forEach(function (obj) {
            if (['40', '41'].indexOf(obj.accountTypeId) != -1) {
                valueAccountListIncome.push({y: -1 * math.round(obj.value, 2), name: obj.code + " | " + obj.name});
                accountListIncome.push(obj.code + " | " + obj.name);
            } else if (['50', '51'].indexOf(obj.accountTypeId) != -1) {
                valueAccountListExpense.push({y: math.round(obj.value), name: obj.code + " | " + obj.name});
                accountListExpense.push(obj.code + " | " + obj.name);
            }
        });

        dataIncome.push({
            type: 'pie',
            data: valueAccountListIncome
        })

        dataExpense.push({
            type: 'pie',
            data: valueAccountListExpense
        })
        data.dataIncome = dataIncome;
        data.dataExpense = dataExpense;
        data.accountListIncome = accountListIncome;
        data.accountListExpense = accountListExpense;
        return data;

    }
});

let getMonthName = (number) => {
    let month = '';
    switch (number) {
        case 1:
            month = 'មករា'
            break;
        case 2:
            month = 'កុម្ភៈ​'
            break;
        case 3:
            month = 'មិនា'
            break;
        case 4:
            month = 'មេសា'
            break;
        case 5:
            month = 'ឧសភា'
            break;
        case 6:
            month = 'មិថុនា'
            break;
        case 7:
            month = 'កក្កដា'
            break;
        case 8:
            month = 'សីហា'
            break;
        case 9:
            month = 'កញ្ញា'
            break;
        case 10:
            month = 'តុលា'
            break;
        case 11:
            month = 'វិច្ឆិកា'
            break;
        case 12:
            month = 'ធ្នូ'
            break;

    }
    return month;
}


function getDaysInMonth(month, year) {
    // Since no month has fewer than 28 days
    var date = new Date(year, month, 1);
    var days = [];
    while (date.getMonth() === month) {
        days.push(moment(date, "DD/MM/YYYY").toDate());
        date.setDate(date.getDate() + 1);
    }
    return days;
}