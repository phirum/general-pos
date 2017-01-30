import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

import './home.html';

// Declare template


var indexTpl = Template.acc_chartDailyIncomeExpense;


var Highcharts = require('highcharts/highstock');

indexTpl.onRendered(function () {

});

indexTpl.events({})

if (Meteor.isClient) {
    indexTpl.helpers({
        createChartDailyIncomeExpense: function () {

            Meteor.call('chart_dailyIncomeExpense',Session.get("currentBranch"), function (err, obj) {

                Meteor.defer(function () {
                    // Create standard Highcharts chart with options:
                    if (obj.dataIncome[0] != undefined || obj.dataExpense[0] != undefined) {


                        Highcharts.chart('dailyIncomeExpenseUSD', {
                            chart: {
                                type: 'column'
                            },

                            title: {
                                text: 'Daily Income Expense '+ obj.dataIncome[0]._id
                            },

                            xAxis: {
                                categories: obj.dataIncome[0].dayList
                            },

                            yAxis: {
                                allowDecimals: true,
                                title: {
                                    text: obj.dataIncome[0]._id
                                }
                            },

                            tooltip: {
                                formatter: function () {
                                    return '<b>' + this.x + '</b><br/>' +
                                        this.series.name + ': ' + this.y + '<br/>' +
                                        'Total: ' + this.point.stackTotal;
                                }
                            },

                            plotOptions: {
                                column: {
                                    stacking: 'normal'
                                }
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: 'Income',
                                data: obj.dataIncome[0].value,
                                stack: 'daily'
                            }, {
                                name: 'Expense',
                                data: obj.dataExpense[0].value,
                                stack: 'daily'
                            }]
                        });
                    }
                    if (obj.dataIncome[1] != undefined || obj.dataExpense[1] != undefined) {


                        Highcharts.chart('dailyIncomeExpenseKHR', {
                            chart: {
                                type: 'column'
                            },

                            title: {
                                text: 'Daily Income Expense '+ obj.dataIncome[1]._id
                            },

                            xAxis: {
                                categories: obj.dataIncome[1].dayList
                            },

                            yAxis: {
                                allowDecimals: true,
                                title: {
                                    text: obj.dataIncome[1]._id
                                }
                            },

                            tooltip: {
                                formatter: function () {
                                    return '<b>' + this.x + '</b><br/>' +
                                        this.series.name + ': ' + this.y + '<br/>' +
                                        'Total: ' + this.point.stackTotal;
                                }
                            },

                            plotOptions: {
                                column: {
                                    stacking: 'normal'
                                }
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: 'Income',
                                data: obj.dataIncome[1].value,
                                stack: 'daily'
                            }, {
                                name: 'Expense',
                                data: obj.dataExpense[1].value,
                                stack: 'daily'
                            }]
                        })
                    }
                    if (obj.dataIncome[2] != undefined || obj.dataExpense[2] != undefined) {

                        Highcharts.chart('dailyIncomeExpenseTHB', {
                            chart: {
                                type: 'column'
                            },

                            title: {
                                text: 'Daily Income Expense '+ obj.dataIncome[2]._id
                            },

                            xAxis: {
                                categories: obj.dataIncome[2].dayList
                            },

                            yAxis: {
                                allowDecimals: true,
                                title: {
                                    text: obj.dataIncome[2]._id
                                }
                            },

                            tooltip: {
                                formatter: function () {
                                    return '<b>' + this.x + '</b><br/>' +
                                        this.series.name + ': ' + this.y + '<br/>' +
                                        'Total: ' + this.point.stackTotal;
                                }
                            },

                            plotOptions: {
                                column: {
                                    stacking: 'normal'
                                }
                            },
                            credits: {
                                enabled: false
                            },
                            series: [{
                                name: 'Income',
                                data: obj.dataIncome[2].value,
                                stack: 'daily'
                            }, {
                                name: 'Expense',
                                data: obj.dataExpense[2].value,
                                stack: 'daily'
                            }]
                        })
                    }
                })


            })
        }

    })
}

indexTpl.onDestroyed(function () {
    Session.set('chart', undefined);
});


