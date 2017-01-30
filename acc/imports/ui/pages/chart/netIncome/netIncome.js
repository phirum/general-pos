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

import './netIncome.html';

// Declare template


var indexTpl = Template.acc_chartNetIncome;
var myNewChart = null;


var Highcharts = require('highcharts/highstock');

indexTpl.onRendered(function () {
    if (Session.get('chart') === undefined) {
        let selector = {};
        selector.year = moment().format("YYYY");
        selector.currency = "usd";
        Session.set('currency', 'usd');
        selector.branchId = Session.get('currentBranch');
        Meteor.call('chart_netIncome', selector, function (err, result) {
            Session.set('chart', result);
        });
    }
    for (i = moment().year(); i > 1900; i--) {
        $('#yearpicker').append($('<option />').val(i).html(i));
    }
    $("#radios").radiosToSlider();
});

indexTpl.events({
    'click #usd': function () {
        let selector = {};
        let year = $("#yearpicker").val();
        selector.year = year;
        selector.currency = "usd";
        selector.branchId = Session.get('currentBranch');
        Session.set('currency', 'usd');
        Meteor.call('chart_netIncome', selector, function (err, result) {
            Session.set('chart', result);
        });
    }, 'click #khr': function () {

        let selector = {};
        let year = $("#yearpicker").val();
        selector.year = year;
        selector.currency = "khr";
        selector.branchId = Session.get('currentBranch');
        Session.set('currency', 'khr');
        Meteor.call('chart_netIncome', selector, function (err, result) {
            Session.set('chart', result);
        });
    }, 'click #baht': function () {
        let selector = {};
        let year = $("#yearpicker").val();
        selector.year = year;
        selector.currency = "baht";
        Session.set('currency', 'baht');
        selector.branchId = Session.get('currentBranch');
        Meteor.call('chart_netIncome', selector, function (err, result) {
            Session.set('chart', result);
        });
    }, 'change #yearpicker': function () {
        let selector = {};
        let year = $("#yearpicker").val();
        selector.year = year;
        let currency = Session.get('currency');
        selector.currency = currency;
        Meteor.call('chart_netIncome', selector, function (err, result) {
            Session.set('chart', result);
        });
    }
})

if (Meteor.isClient) {
    indexTpl.helpers({
        createChartNetIncome: function () {
            let obj = Session.get("chart");
            if (obj != undefined) {
                Meteor.defer(function () {
                    // Create standard Highcharts chart with options:
                    Highcharts.chart('chartIncome', {
                        chart: {
                            type: 'column'
                        },
                        title: {
                            text: 'Net Income'
                        },
                        xAxis: {
                            categories: obj.monthList,
                            title: {
                                text: null
                            }
                        },
                        yAxis: {
                            /*min: 0,
                             title: {
                             text: 'Population (millions)',
                             align: 'high'
                             },*/
                            labels: {
                                overflow: 'justify'
                            }
                        },
                        /*tooltip: {
                         valueSuffix: ' millions'
                         },*/
                        plotOptions: {
                            column: {
                                dataLabels: {
                                    enabled: true
                                }
                            }
                        },
                        legend: {
                            layout: 'vertical',
                            align: 'center',
                            verticalAlign: 'bottom',
                            x: -40,
                            y: 80,
                            floating: true,
                            borderWidth: 1,
                            backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                            shadow: true
                        },
                        credits: {
                            enabled: false
                        },
                        series: obj.data
                    });
                })
            }
        }
    })
}

indexTpl.onDestroyed(function () {
    Session.set('chart', undefined);
});


// $(document).ready( function(){
//
//
//
// });