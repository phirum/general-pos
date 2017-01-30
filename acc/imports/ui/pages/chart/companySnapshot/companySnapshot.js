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
import {createNewAlertify} from '../../../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../../core/client/libs/display-alert.js';
import {__} from '../../../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../../../core/client/components/loading.js';
import '../../../../../../core/client/components/column-action.js';
import '../../../../../../core/client/components/form-footer.js';

// Collection
import {CloseChartAccountPerMonth} from '../../../../api/collections/closeChartAccountPerMonth';
import {ChartAccount} from '../../../../api/collections/chartAccount';
import {AccountType} from '../../../../api/collections/accountType';


import './companySnapshot.html';

// Declare template

var indexTpl = Template.acc_companySnapshot;
var stateSelectorChart = new ReactiveObj({
    currency: "USD",
    yearSelect: moment().format("YYYY")
})

var Highcharts = require('highcharts/highstock');


indexTpl.onRendered(function () {
    stateSelectorChart.set('currency', 'USD');

    for (i = moment().year(); i > 1900; i--) {
        $('#yearpicker').append($('<option />').val(i).html(i));
    }
    stateSelectorChart.set('yearSelect', $("#yearpicker").val());


    var monthPicker = ['This Month', 'Last Month', 'Last Quater'];
    monthPicker.forEach(function (obj) {
        $('#monthpicker').append($('<option />').val(obj).html(obj));

    })

    stateSelectorChart.set('month', [s.pad(moment().toDate().getMonth() + 1,2,"0")]);


    getDataForChart();
});


indexTpl.events({
    'click #usd': function () {
        stateSelectorChart.set('currency', 'USD');
        getDataForChart();
    }, 'click #khr': function () {
        stateSelectorChart.set('currency', 'KHR');
        getDataForChart();
    }, 'click #baht': function () {
        stateSelectorChart.set('currency', 'THB');
        getDataForChart();
    }, 'change #yearpicker': function () {
        stateSelectorChart.set('yearSelect', $("#yearpicker").val());
        getDataForChart();
    }, 'change #monthpicker': function (e, t) {
        if ($(e.currentTarget).val() == "This Month") {
            stateSelectorChart.set('month', [s.pad(moment().toDate().getMonth() + 1,2,"0")]);
        } else if ($(e.currentTarget).val() == "Last Month") {
            stateSelectorChart.set('month', [s.pad(moment().toDate().getMonth(),2,"0")]);
        } else if ($(e.currentTarget).val() == "Last Quater") {
            let curMonth=(moment().toDate().getMonth()) + 1;
            let monthList=[];
            for(i=curMonth;i>curMonth-3;i--){
                if(i>0){
                    monthList.push(s.pad(i,2,"0")+"");
                }
            }

            stateSelectorChart.set('month', monthList);
        }
        getDataForChart();
    }
})

if (Meteor.isClient) {
    indexTpl.helpers({
        createChartIncome: function () {
            // Gather data:
            let obj = Session.get("objCompanySnapshot");
            // Use Meteor.defer() to craete chart after DOM is ready:
            if (obj != undefined) {
                Meteor.defer(function () {
                    // Create standard Highcharts chart with options:
                    Highcharts.chart('chartIncome', {
                        title: {
                            text: '<b class="label label-default">Income</b>'
                        },
                        xAxis: {
                            categories: obj.accountListIncome,
                            title: {
                                text: null
                            }
                        },
                        yAxis: {
                            // min: 0,
                            title: {
                                text: 'Value',
                                align: 'high'
                            },
                            labels: {
                                overflow: 'justify'
                            }
                        },
                        /*tooltip: {
                         pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                         },*/
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        },
                        legend: {
                            layout: 'vertical',
                            align: 'right',
                            verticalAlign: 'top',
                            x: -20,
                            y: 0,
                            floating: true,
                            borderWidth: 1,
                            backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                            shadow: true
                        },
                        credits: {
                            enabled: false
                        },
                        series: obj.dataIncome
                    });

                })
            }
        },
        createChartExpense: function () {
            // Gather data:
            let obj = Session.get("objCompanySnapshot");
            // Use Meteor.defer() to craete chart after DOM is ready:
            if (obj != undefined) {
                Meteor.defer(function () {
                    // Create standard Highcharts chart with options:
                    Highcharts.chart('chartExpense', {
                        title: {
                            text: '<b class="label label-default">Expense</b>'
                        },
                        xAxis: {
                            categories: obj.accountListExpense,
                            title: {
                                text: null
                            }
                        },
                        yAxis: {
                            // min: 0,
                            title: {
                                text: 'Value',
                                align: 'high'
                            },
                            labels: {
                                overflow: 'justify'
                            }
                        },
                        /*tooltip: {
                         pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                         },*/
                        plotOptions: {
                            pie: {
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '<b>{point.name}</b>: {point.percentage:.1f}%',
                                    style: {
                                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                    }
                                }
                            }
                        },
                        legend: {
                            layout: 'vertical',
                            align: 'right',
                            verticalAlign: 'top',
                            x: -20,
                            y: 0,
                            floating: true,
                            borderWidth: 1,
                            backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                            shadow: true
                        },
                        credits: {
                            enabled: false
                        },
                        series: obj.dataExpense
                    });
                })
            }
        }
    })
    ;
}


var getDataForChart = function () {
    let selector = {};
    selector.year = stateSelectorChart.get('yearSelect');
    selector.currencyId = stateSelectorChart.get('currency');
    selector.branchId = Session.get('currentBranch');
    selector.month = {$in: stateSelectorChart.get('month')}

    Meteor.call("chart_companySnapshot", selector, function (err, obj) {
        if (obj != undefined) {
            Session.set("objCompanySnapshot", obj);
        }
    })
}


function LastDayOfMonth(Year, Month) {
    return new Date((new Date(Year, Month, 1)) - 1);
}

function FirstDayOfMonth(Year, Month) {
    return new Date((new Date(Year, Month - 1, 1)) + 1);
}