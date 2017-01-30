import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { _ } from 'meteor/erasaur:meteor-lodash';
import { moment } from 'meteor/momentjs:moment';

// Collection
import { Company } from '../../../../core/imports/api/collections/company.js';
import { Setting } from '../../../../core/imports/api/collections/setting';
import { Exchange } from '../../../../core/imports/api/collections/exchange';

import { CloseChartAccount } from '../../../imports/api/collections/closeChartAccount';


import { ChartAccount } from '../../../imports/api/collections/chartAccount';
import { MapClosing } from '../../../imports/api/collections/mapCLosing';

import { SpaceChar } from '../../../common/configs/space';

Meteor.methods({
    acc_profitLostComparation: function (params) {
        if (!this.isSimulation) {
            var data = {
                title: {},
                header: {},
                content: [{
                    index: 'No Result'
                }],
                footer: {}
            };

            var date = s.words(params.date, ' - ');
            var fDate = moment(date[0], 'DD/MM/YYYY').toDate();
            var tDate = moment(date[1], 'DD/MM/YYYY').add(1, 'days').toDate();

            var startYear = moment(fDate).year();
            var startDate = moment('01-01-' + startYear, "DD/MM/YYYY").toDate();

            let startMonth = (moment(fDate).month()) + 1;
            let endMonth = (moment(date[1], 'DD/MM/YYYY').toDate().getMonth()) + 1;
            let numMonth = endMonth - startMonth + 2;

            /****** Title *****/
            data.title = Company.findOne();

            /****** Header *****/
            let exchangeData=Exchange.findOne({_id: params.exchangeDate});
            params.exchangeData=moment(exchangeData.exDate).format("DD/MM/YYYY") + ' | ' + JSON.stringify(exchangeData.rates)

            data.header = params;
            /****** Content *****/

            var self = params;
            var selector = {};

            let cogs = MapClosing.findOne({ chartAccountCompare: "Cost Of Goods Sold" });

            if (!_.isEmpty(self.date)) {
                selector.journalDate = {
                    $gte: fDate,
                    $lt: tDate
                };
            }


            if (self.currencyId != "All") {
                selector.currencyId = self.currencyId;
            }
            if (self.branchId != "All") {
                selector.branchId = self.branchId;
            }

            if (self.currencyId != "All") {
                var baseCurrency = self.currencyId;
            } else {
                baseCurrency = Setting.findOne().baseCurrency;
            }


            let contentProfit = Meteor.call("getProfitLostComparation", selector, self.showNonActive, baseCurrency, endMonth, startYear, params.exchangeDate);
            // let incomeTotalList = Meteor.call("getIncomeGroupByMonth", selector, baseCurrency, params.exchangeDate);
            // let expenseTotalList = Meteor.call("getExpenseGroupByMonth", selector, baseCurrency, params.exchangeDate);

            // //Total
            // incomeTotalList.sort(compare);
            // expenseTotalList.sort(compare);


            // let totalIncome = "<tr><td><b>Total Income</td>";
            // let totalExpense = "<tr><td><b>Total Expense</b></td>";
            // let netProfit = "<tr><td><b>Net Income</b></td>";
            // let grandTotalIncome = 0;
            // let grandTotalExpense = 0;
            // let grandTotalNetIncome = 0;
            // let accountTypeGrand = "";
            // let m = startMonth;
            // let n = startMonth;

            // let lastTotalIncome = startMonth;
            // let lastTotalExpense = startMonth;

            // let netProfitList = [];


            // let cogs = MapClosing.findOne({ chartAccountCompare: "Cost Of Goods Sold" });

            // incomeTotalList.forEach(function (obj) {

            //     for (let k = m; k <= endMonth; k++) {
            //         if (k == obj._id.month) {

            //             totalIncome += "<td><b>" + numeral(-obj.value).format("(0,00.00)") + "</b></td>";
            //             grandTotalIncome += (-obj.value);
            //             lastTotalIncome = obj._id.month + 1;

            //             netProfitList.push({ month: k, value: obj.value });


            //             m = obj._id.month + 1;
            //             accountTypeGrand = obj._id.accountType;
            //             return false;
            //         } else {
            //             totalIncome += "<td><b>" + 0 + "</b></td>";
            //             lastTotalIncome = obj._id.month + 1;
            //             netProfitList.push({ month: k, value: 0 });
            //         }
            //     }
            // })



            // expenseTotalList.forEach(function (obj) {

            //     for (let k = n; k <= endMonth; k++) {
            //         if (k == obj._id.month) {
            //             totalExpense += "<td><b>" + numeral(obj.value).format("(0,00.00)") + "</b></td>";
            //             grandTotalExpense += obj.value;
            //             lastTotalExpense = obj._id.month + 1;

            //             netProfitList.push({ month: k, value: obj.value });


            //             n = obj._id.month + 1;
            //             accountTypeGrand = obj._id.accountType;
            //             return false;
            //         } else {

            //             totalExpense += "<td><b>" + 0 + "</b></td>";
            //             lastTotalExpense = obj._id.month + 1;

            //             netProfitList.push({ month: k, value: 0 });

            //         }
            //     }
            // })


            // for (let i = m; i <= endMonth; i++) {
            //     totalIncome += '<td><b>' + 0 + '</b></td>';
            //     lastTotalIncome = i + 1;

            //     netProfitList.push({ month: i, value: 0 });
            // }
            // for (let i = n; i <= endMonth; i++) {
            //     totalExpense += '<td><b>' + 0 + '</b></td>';
            //     lastTotalExpense = i + 1;

            //     netProfitList.push({ month: i, value: 0 });
            // }





            // for (let i = lastTotalIncome; i <= endMonth; i++) {
            //     totalIncome += '<td><b>' + 0 + '</b></td>';

            //     netProfitList.push({ month: i, value: 0 });

            // }

            // for (let i = lastTotalExpense; i <= endMonth; i++) {
            //     totalExpense += '<td><b>' + 0 + '</b></td>';

            //     netProfitList.push({ month: i, value: 0 });
            // }


            // totalIncome += "<td><b>" + numeral(grandTotalIncome).format("(0,00.00)") + "</b></td></tr>";
            // totalExpense += "<td><b>" + numeral(grandTotalExpense).format("(0,00.00)") + "</b></td></tr>";

            // let arrProfitLost = [];
            // netProfitList.reduce(function (key, val) {
            //     if (!key[val.month]) {
            //         key[val.month] = {
            //             month: val.month,
            //             value: val.value
            //         };
            //         arrProfitLost.push(key[val.month]);
            //     } else {
            //         key[val.month].value += val.value;
            //     }
            //     return key;
            // }, {});

            // arrProfitLost.forEach(function (obj) {
            //     netProfit += "<td><b>" + numeral(-obj.value).format("(0,00.00)") + "</b></td>";
            //     grandTotalNetIncome += obj.value;
            // })


            // netProfit += "<td><b>" + numeral(-grandTotalNetIncome).format("(0,00.00)") + "</b></td></tr>";


            // //Detail
            // let contentProfitList = [];
            // contentProfit.reduce(function (key, val) {
            //     if (!key[val._id.account + val._id.month + val._id.year]) {

            //         key[val._id.account + val._id.month + val._id.year] = {
            //             accountTypeId: val._id.accountTypeId,
            //             name: val._id.name,
            //             currency: val._id.currencyId,
            //             code: val._id.code,
            //             level: val._id.level,
            //             month: val._id.month,
            //             year: val._id.year,
            //             parentId: val._id.parent,

            //             value: val.value
            //         };

            //         contentProfitList.push(key[val._id.account + val._id.month + val._id.year]);
            //     } else {
            //         key[val._id.account + val._id.month + val._id.year].value += val.value;
            //     }
            //     return key;
            // }, {});


            // contentProfitList.sort(sortTowParam);

            // let content = '<table class="report-content">'
            //     + '             <thead class="report-content-header">'
            //     + '                  <tr>'
            //     + '                     <th>Account Name</th>'


            // for (let i = startMonth; i <= endMonth; i++) {
            //     content += '<th>' + getMonthName(i) + '</th>';
            // }

            // content += '                     <th>សរុប</th>'
            //     + '                  </tr>'
            //     + '             </thead>'
            //     + '             <tbody class="report-content-body">';


            // let income = '      <tr>'
            //     + '                 <td colspan="14"><b>Income</b></td>'
            //     + '              </tr>'

            // let exense = '      <tr>'
            //     + '                 <td colspan="14"><b>Expense</b></td>'
            //     + '              </tr>'


            // let codeTemp = "";
            // let j = startMonth;
            // let accountType = "";

            // let subTotalByAccount = 0;


            // contentProfitList.forEach(function (obj) {


            //     //To show column don't have value and subtotal by account
            //     if (codeTemp != obj.code) {

            //         if (codeTemp != "") {
            //             for (let i = j; i <= endMonth; i++) {
            //                 if (accountType == "40" || accountType == "41") {
            //                     income += '<td>' + 0 + '</td>';
            //                 } else if (accountType == "50" || accountType == "51") {
            //                     exense += '<td>' + 0 + '</td>';
            //                 }
            //             }


            //             if (accountType == "40" || accountType == "41") {
            //                 income += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
            //             } else if (accountType == "50" || accountType == "51") {
            //                 exense += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
            //             }



            //             subTotalByAccount = 0;
            //         }

            //         if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
            //             income += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj.code + " | " + obj.name;
            //         } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
            //             exense += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + obj.code + " | " + obj.name;
            //         }
            //         j = startMonth;
            //     }

            //     //TO show all column that have value
            //     for (let i = j; i <= endMonth; i++) {
            //         if (obj.month == i) {

            //             //To show column that have value
            //             if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
            //                 income += '<td>' + numeral(-obj.value).format("(0,00.00)") + '</td>';
            //                 subTotalByAccount += -obj.value;
            //             } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
            //                 exense += '<td>' + numeral(obj.value).format("(0,00.00)") + '</td>';
            //                 subTotalByAccount += obj.value;
            //             }

            //             codeTemp = obj.code;
            //             j = 1 + obj.month;
            //             accountType = obj.accountTypeId;
            //             return false;
            //         } else {

            //             //To show column don't have value before column that have value
            //             if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
            //                 income += '<td>' + 0 + '</td>';
            //             } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
            //                 exense += '<td>' + 0 + '</td>';
            //             }
            //         }
            //     }
            // });


            // //To show the last column that don't have value
            // if (codeTemp != "") {
            //     for (let i = j; i <= endMonth; i++) {
            //         if (accountType == "40" || accountType == "41") {
            //             income += '<td>' + 0 + '</td>';
            //         } else if (accountType == "50" || accountType == "51") {
            //             exense += '<td>' + 0 + '</td>';
            //         }
            //     }


            //     if (accountType == "40" || accountType == "41") {
            //         income += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
            //     } else if (accountType == "50" || accountType == "51") {
            //         exense += '<td>' + numeral(subTotalByAccount).format("(0,00.00)") + '</td></tr>';
            //     }
            // }


            // content += income + totalIncome + exense + totalExpense + netProfit + '</tbody></table>';
            // data.content = content;










            // // Tow dimensional Array


            //Detail
            let contentProfitList = [];
            contentProfit.reduce(function (key, val) {
                if (!key[val._id.account + val._id.month + val._id.year]) {

                    key[val._id.account + val._id.month + val._id.year] = {
                        accountTypeId: val._id.accountTypeId,
                        name: val._id.name,
                        currency: val._id.currencyId,
                        code: val._id.code,
                        level: val._id.level,
                        month: val._id.month,
                        year: val._id.year,
                        parentId: val._id.parent,

                        value: val.value
                    };

                    contentProfitList.push(key[val._id.account + val._id.month + val._id.year]);
                } else {
                    key[val._id.account + val._id.month + val._id.year].value += val.value;
                }
                return key;
            }, {});


            contentProfitList.sort(sortTowParam);

            let content = '<table class="report-content">'
                + '             <thead class="report-content-header">'
                + '                  <tr>'
                + '                     <th>Account Name</th>'


            for (let i = startMonth; i <= endMonth; i++) {
                content += '<th>' + getMonthName(i) + '</th>';
            }

            content += '                     <th>សរុប</th>'
                + '                  </tr>'
                + '             </thead>'
                + '             <tbody class="report-content-body">';


            let incomeData = '      <tr>'
                + '                 <td colspan="14"><b>Income</b></td>'
                + '              </tr>'

            let expenseData = '      <tr>'
                + '                 <td colspan="14"><b>Expense</b></td>'
                + '              </tr>'


            let j = startMonth;

            let arr = [];

            let totalSubArr = [];
            let subArr = [];
            let arrIncome = [];
            let arrExpense = [];
            let temp = { code: "" };

            let totalIncomeData = "";
            let totalExpenseData = "";

            let netProfitData = "";

            let isPush = false;

            let tempParent = "";
            let accountType = "";
            let level = 0;
            let dataOld = {};

            let arrCOGS = [];

            contentProfitList.forEach(function (obj) {
                if (obj.code == cogs.accountDoc.code) {
                    // Cost Of Goods Sold
                    arrCOGS.push({ month: obj.month, value: obj.value });

                } else {
                    let style = "";
                    if (obj.level > 0) {
                        style = "align='left'";
                    } else {
                        style = "align='right'";
                    }


                    let styleBefore = "";
                    if (level > 0) {
                        styleBefore = "align='left'";
                    } else {
                        styleBefore = "align='right'";
                    }


                    // add column when don't have value
                    if (temp.code != obj.code) {
                        if (temp.code != "") {
                            for (let i = j; i <= endMonth; i++) {
                                if (accountType == "40" || accountType == "41") {
                                    incomeData += '<td ' + styleBefore + '>' + formatMoney(0) + '</td>';
                                } else if (accountType == "50" || accountType == "51") {
                                    expenseData += '<td ' + styleBefore + '>' + formatMoney(0) + '</td>';
                                }
                                arr.push(0);

                                // add value when have sub level
                                if (level > 0) {
                                    subArr.push(0);
                                }
                            }

                            // subTotal
                            if (accountType == "40" || accountType == "41") {
                                arrIncome.push(arr);
                                let subTotalRowList = sumRow(arrIncome);
                                let amount = 0;
                                subTotalRowList.forEach(function (val) {
                                    amount = val;
                                });
                                incomeData += '<td ' + styleBefore + '>' + formatMoney(-amount) + '</td></tr>';


                            } else if (accountType == "50" || accountType == "51") {
                                arrExpense.push(arr);
                                let subTotalRowList = sumRow(arrExpense);
                                let amount = 0;
                                subTotalRowList.forEach(function (val) {
                                    amount = val;
                                });
                                expenseData += '<td ' + styleBefore + '>' + formatMoney(amount) + '</td></tr>';

                            }

                            if (level > 0) {
                                totalSubArr.push(subArr);
                                subArr = [];
                            }


                            arr = [];
                        }
                        j = startMonth;
                    }


                    // add Total SubAccount when have Parent
                    if (isPush == true && tempParent != obj.parentId) {
                        let subTotalColumnList = sumColumn(totalSubArr);
                        dataOld = ChartAccount.findOne({ _id: tempParent });
                        if (accountType == "40" || accountType == "41") {
                            incomeData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Total : ' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '</td>';
                            let totalSubAmount = 0;
                            subTotalColumnList.forEach(function (val) {
                                incomeData += "<td align='right'>" + formatMoney(-val) + "</td>";
                                totalSubAmount += val;
                            })
                            incomeData += "<td align='right'>" + formatMoney(-totalSubAmount) + "</td></tr>";

                        } else if (accountType == "50" || accountType == "51") {
                            expenseData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Total : ' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '</td>';
                            let totalSubAmount = 0;
                            subTotalColumnList.forEach(function (val) {
                                expenseData += "<td align='right'>" + formatMoney(val) + "</td>";
                                totalSubAmount += val;
                            })

                            expenseData += "<td align='right'>" + formatMoney(totalSubAmount) + "</td></tr>";
                        }

                        isPush = false;
                        totalSubArr = [];

                    }


                    // add Header when have parent
                    if (obj.level > 0) {
                        if (tempParent != obj.parentId) {
                            let dataOld = ChartAccount.findOne({ _id: obj.parentId });

                            if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                                incomeData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '<td colspan="' + numMonth + '"></td></tr>';
                            } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                                expenseData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '<td colspan="' + numMonth + '"></td></tr>';
                            }
                            isPush = true;
                        }
                    }

                    if (temp.code != obj.code) {
                        if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                            incomeData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + SpaceChar.space(6 * obj.level) + obj.code + " | " + obj.name;
                        } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                            expenseData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + SpaceChar.space(6 * obj.level) + obj.code + " | " + obj.name;
                        }
                    }



                    // add column when have value
                    for (let i = j; i <= endMonth; i++) {


                        if (obj.month == i) {


                            if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                                incomeData += "<td " + style + ">" + formatMoney(-obj.value) + "</td>";
                            } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                                expenseData += "<td " + style + ">" + formatMoney(obj.value) + "</td>";
                            }


                            arr.push(obj.value);

                            // add value when have sub level
                            if (obj.level > 0) {
                                subArr.push(obj.value);
                            }
                            break;
                        } else {
                            if (obj.accountTypeId == "40" || obj.accountTypeId == "41") {
                                incomeData += "<td " + style + ">" + formatMoney(0) + "</td>";
                            } else if (obj.accountTypeId == "50" || obj.accountTypeId == "51") {
                                expenseData += "<td " + style + ">" + formatMoney(0) + "</td>";
                            }
                            arr.push(0);

                            // add value when have sub level
                            if (obj.level > 0) {
                                subArr.push(0);
                            }
                        }
                    }

                    j = obj.month + 1;
                    temp = obj;
                    tempParent = obj.parentId;
                    accountType = obj.accountTypeId;
                    level = obj.level;
                }
            })



            // Last add column
            if (arr.length > 0) {
                let styleBefore = "";
                if (level > 0) {
                    styleBefore = "align='left'";
                } else {
                    styleBefore = "align='right'";
                }

                for (let i = j; i <= endMonth; i++) {
                    if (accountType == "40" || accountType == "41") {
                        incomeData += "<td " + styleBefore + ">" + formatMoney(0) + "</td>";
                    } else if (accountType == "50" || accountType == "51") {
                        expenseData += "<td " + styleBefore + ">" + formatMoney(0) + "</td>";
                    }

                    arr.push(0);
                    // add value when have sub level
                    if (level > 0) {
                        subArr.push(0);
                    }
                }

                // subTotal
                if (accountType == "40" || accountType == "41") {
                    arrIncome.push(arr);
                    let subTotalRowList = sumRow(arrIncome);
                    let amount = 0;
                    subTotalRowList.forEach(function (val) {
                        amount = val;
                    });
                    incomeData += '<td ' + styleBefore + '>' + formatMoney(-amount) + '</td></tr>';


                } else if (accountType == "50" || accountType == "51") {
                    arrExpense.push(arr);
                    let subTotalRowList = sumRow(arrExpense);
                    let amount = 0;
                    subTotalRowList.forEach(function (val) {
                        amount = val;
                    });
                    expenseData += '<td ' + styleBefore + '>' + formatMoney(amount) + '</td></tr>';

                }

                if (level > 0) {
                    totalSubArr.push(subArr);
                    subArr = [];

                }
                arr = [];
            }
            // Last add SubTotal SubAccount when have
            if (isPush == true) {
                let subTotalColumnList = sumColumn(totalSubArr);
                dataOld = ChartAccount.findOne({ _id: tempParent });
                if (accountType == "40" || accountType == "41") {
                    incomeData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Total : ' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '</td>';
                    let totalSubAmount = 0;
                    subTotalColumnList.forEach(function (val) {
                        incomeData += "<td align='right'>" + formatMoney(-val) + "</td>";
                        totalSubAmount += val;
                    })
                    incomeData += "<td>" + formatMoney(-totalSubAmount) + "</td></tr>";

                } else if (accountType == "50" || accountType == "51") {
                    expenseData += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Total : ' + SpaceChar.space(6 * dataOld.level) + dataOld.code + " | " + dataOld.name + '</td>';
                    let totalSubAmount = 0;
                    subTotalColumnList.forEach(function (val) {
                        expenseData += "<td align='right'>" + formatMoney(val)+ "</td>";
                        totalSubAmount += val;
                    })

                    expenseData += "<td align='right'>" + formatMoney(totalSubAmount) + "</td></tr>";
                }

                isPush = false;
                totalSubArr = [];

                isPush = false;
            }

            // // Total Row and Column
            // let arrLength = arrIncome.length;
            // let totalRow = [];
            // let totalColumn = [];
            // for (let i = 0; i < arrLength; i++) {
            //     totalRow[i] = 0;
            //     for (let j = 0; j < endMonth + 1 - startMonth; j++) {

            //         totalRow[i] += parseFloat(arrIncome[i][j]);

            //         totalColumn[j] = 0;
            //         for (let m = 0; m < arrLength; m++) {
            //             totalColumn[j] += parseFloat(arrIncome[m][j]);
            //         }
            //     }
            // }







            // cogs
            let numMonthAddOne = numMonth + 1;
            let cogsDataMain = "<tr  style='font-weight: bold'><td colspan='" + numMonthAddOne + "'>Cost Of Goods Sold Expense</td></tr><tr><td>&nbsp;&nbsp;&nbsp;&nbsp;" + cogs.accountDoc.code + " | " + cogs.accountDoc.name + "</td>";
            let cogsData = "";
            let arrCOGSList = [];
            let arrCOGSMain=[];
            let totalCogs = 0;
            let n = startMonth;
            arrCOGS.forEach(function (val) {
                for (let i = n; i <= endMonth; i++) {
                    if (i == val.month) {
                        cogsData += "<td align='right'>" + formatMoney(val.value) + "</td>";
                        totalCogs += val.value;
                        arrCOGSList.push(val.value);
                        break;
                    } else {
                        cogsData += "<td align='right'>" + formatMoney(0) + "</td>";
                        arrCOGSList.push(0);
                    }
                }
                n = val.month + 1;
            })
            for (let i = n; i <= endMonth; i++) {
                cogsData += "<td align='right'>" + formatMoney(0) + "</td>";
                arrCOGSList.push(0);
            }
            arrCOGSMain.push(arrCOGSList);
            arrCOGSList=[];

            cogsData += "<td align='right'>" + formatMoney(totalCogs) + "</td></tr>";
            cogsDataMain += cogsData;
            cogsDataMain += "<tr  style='font-weight: bold'><td>Total Cost Of Goods Sold</td>" + cogsData;

            // Gross Profit
            let grossProfitList = arrIncome.concat(arrCOGSMain);
            let grossProfitData = "<tr style='font-weight: bold'><td>Gross Profit</td>";
            let k = startMonth;
            let totalGrossProfit = 0;

            let grossProfitSum = sumColumn(grossProfitList);
            if (grossProfitSum) {
                grossProfitSum.forEach(function (val) {
                    grossProfitData += "<td align='right'>" + formatMoney(-val) + "</td>";
                    totalGrossProfit += val;
                })
            }
            grossProfitData += "<td align='right'>"+formatMoney(-totalGrossProfit)+"</td></tr>";


            // Total Income
            let totalIncomeDataList = sumColumn(arrIncome);
            let subTotalIncome = 0;
            totalIncomeDataList.forEach(function (val) {
                totalIncomeData += "<td align='right'>" + formatMoney(-val) + "</td>";
                subTotalIncome += val;
            })
            totalIncomeData += "<td align='right'>" + formatMoney(-subTotalIncome) + "</td>";

            // Total Expense
            let subTotalExpense = 0;
            let totalExpenseDataList = sumColumn(arrExpense);
            totalExpenseDataList.forEach(function (val) {
                totalExpenseData += "<td align='right'>" + formatMoney(val)+ "</td>";
                subTotalExpense += val;
            })
            totalExpenseData += "<td align='right'>" + formatMoney(subTotalExpense) + "</td>";

            // Total Net Income
            let arrNetIncome = [];
            arrNetIncome = grossProfitList.concat(arrExpense);

            let totalNetIncomeList = sumColumn(arrNetIncome);
            let totalNetIncome = 0;
            totalNetIncomeList.forEach(function (val) {
                netProfitData += "<td align='right'>" + formatMoney(-val)+ "</td>";
                totalNetIncome += val;
            })

            netProfitData += "<td align='right'>" + formatMoney(-totalNetIncome) + "</td>";









            content += incomeData + "<tr style='font-weight: bold'><td>Total Income</td>" + totalIncomeData + "</tr>" + cogsDataMain + grossProfitData + expenseData + "<tr style='font-weight: bold'><td>Total Expense</td>" + totalExpenseData + "</tr><tr style='font-weight: bold'><td>Net Profit</td>" + netProfitData + '</tr></tbody></table>';
            data.content = content;


            return data;
        }
    }
});

let sortTowParam = function (a, b) {
    if (a.code == b.code) {
        return (a.month < b.month) ? -1 : (a.month > b.month) ? 1 : 0;
    }
    else {
        return (a.code < b.code) ? -1 : 1;
    }
}

let compare = function (a, b) {
    if (a._id.month < b._id.month) {
        return -1;
    } else if (a._id.month > b._id.month) {
        return 1;
    } else {
        return 0;
    }
}


let sumRow = function (arrList) {

    // Total Row
    let totalRow = [];
    if (arrList.length > 0) {
        let arrLength = arrList.length;

        for (let i = 0; i < arrLength; i++) {
            let endMonth = arrList[i].length;
            totalRow[i] = 0;
            for (let j = 0; j < endMonth; j++) {
                totalRow[i] += parseFloat(arrList[i][j]);
            }
        }
    }
    return totalRow;
}

let sumColumn = function (arrList) {
    // Total Column
    let totalColumn = [];
    if (arrList.length > 0) {
        let columnLength = arrList.length;
        let rowLength = arrList[0].length;

        for (let i = 0; i < rowLength; i++) {

            totalColumn[i] = 0;
            for (let j = 0; j < columnLength; j++) {
                totalColumn[i] += parseFloat(arrList[j][i]);
            }
        }
    }
    return totalColumn;
}



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


formatMoney=function (val) {
    if(val!=0){
        return numeral(val).format("(0,00.00)");
    }else {
        return ""
    }
};


