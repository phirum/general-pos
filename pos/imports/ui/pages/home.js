import {Template} from  'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';

// Chart js
import Chart from 'chart.js';

// Highcharts
import Highcharts from 'highcharts';
// Load module after Highcharts is loaded
require('highcharts/modules/exporting')(Highcharts);
// collection
import {EnterBills} from '../../api/collections/enterBill';
import {PayBills} from '../../api/collections/payBill';
import {Invoices} from '../../api/collections/invoice';
import {GroupInvoice} from '../../api/collections/groupInvoice';
import {ReceivePayment} from '../../api/collections/receivePayment';
import {GroupBill} from '../../api/collections/groupBill';
import {tmpCollection} from '../../api/collections/tmpCollection';
// Method
// Page
import './home.html';

// Declare template
let indexTmpl = Template.Pos_home;
let income = new ReactiveVar();
let dashboardTransactionType = new ReactiveVar('invoice');
let dashboardTransactionData = new ReactiveVar(false);
indexTmpl.onCreated(function () {
    dashboardTransactionType.set('invoice');
    this.isLoading = new ReactiveVar(true);
    this.loaded = new ReactiveVar(0);
    this.limit = new ReactiveVar(5);
    this.autorun(()=> {
        tmpCollection.remove({});
        let limit = this.limit.get();
        // let query = instance.query.get();
        let type = dashboardTransactionType.get();
        if (type == 'invoice' || type == 'receivePayment' || type == 'groupInvoice' || type == 'enterBill' || type == 'payBill' || type == 'groupBill') {
            this.subscription = Meteor.subscribe(`pos.${type}TransactionIn7days`, {branchId: Session.get('currentBranch')},{limit: limit});
        }
        if (this.subscription.ready()) {
            this.loaded.set(limit);
        }
    });
});

indexTmpl.onRendered(function () {
    this.autorun(()=> {
        if (this.subscription.ready()) {
            dashboardTransactionData.set(true);
        }
    });
    this.autorun(()=> {
        Meteor.call('posChart', {}, (err, result)=> {
            let chartOpts = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'វិក័យប័ត្រលក់សរុបប្រចាំខែ(Monthly Invoice)'
                },
                subtitle: {
                    text: `${result.company}`
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'Amount'
                    }

                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true,
                            format: '{point.y:.2f}$'
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}$</b><br/>'
                },

                series: [{
                    name: 'AMOUNT',
                    colorByPoint: true,
                    data: result.invoices
                }],
            };

            this.$('#container').highcharts(chartOpts);

            // Stop loading
            this.isLoading.set(false);


        });
        Meteor.call('incomeFn', function (err, result) {
            if (result) {
                income.set(result);
            } else {
                console.log(err);
            }
        });
    });
});

indexTmpl.helpers({
    isLoading(){
        return Template.instance().isLoading.get();
    },
    income(){
        let incomeObj = income.get();
        return incomeObj;
    },
    data(){
        let getData = dashboardTransactionData.get();
        if (getData) {
            let instance = Template.instance();
            let limit = instance.loaded.get()
            let type = dashboardTransactionType.get();
            let data;
            switch (type) {
                case 'invoice':
                    data = Invoices.find({}, {sort: {invoiceDate: -1}});
                    break;
                case 'enterBill':
                    data = EnterBills.find({}, {sort: {enterBillDate: -1}, limit: limit});
                    break;
                case 'receivePayment':
                    data = ReceivePayment.find({}, {sort: {paymentDate: -1}, limit: limit});
                    break;
                case 'payBill':
                    data = PayBills.find({}, {sort: {paymentDate: -1}, limit: limit});
                    break;
                case 'groupInvoice':
                    data = GroupInvoice.find({}, {sort: {startDate: -1}, limit: limit});
                    break;
                case 'groupBill':
                    data = GroupBill.find({}, {sort: {startDate: -1}, limit: limit});
                    break;
            }
            if(data.count() > 0) {
                data.forEach(function (obj) {
                    Meteor.call('getCustomerOrVendorInfo', {obj}, function (err, result) {
                        tmpCollection.insert(result, function (err, result) {
                        });
                    });
                });
            }
            return {collection: tmpCollection.find(), collectionCount: tmpCollection.find().count()};
        }
        return false;
    },
    isData(data){
        return data.count() > 0;
    },
    checkTypeOfDate(){
        let type = dashboardTransactionType.get();
        let date;
        switch (type) {
            case 'invoice':
                date = moment(this.invoiceDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'enterBill':
                date = moment(this.enterBillDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'receivePayment':
                date = moment(this.paymentDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'payBill':
                date = moment(this.paymentDate).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'groupInvoice':
                date = moment(this.startDate).format('YYYY-MM-DD') + ' to ' + moment(this.endDate).format('YYYY-MM-DD');
                break;
            case 'groupBill':
                date = moment(this.startDate).format('YYYY-MM-DD') + ' to ' + moment(this.endDate).format('YYYY-MM-DD');
                break;

        }
        return date;
    },
    convertDate(date){
        return moment(date).toDate();
    },
    isReceivePayment(){
        let type = dashboardTransactionType.get();
        let concat;
        switch (type) {
            case 'receivePayment':
                concat = `Due Amount: <b><u>$${formatNumber(this.dueAmount)}</u></b>, <br>Paid Amount: <b><u>$${formatNumber(this.paidAmount)}</u></b>, <br>Balance: <b><u>$${formatNumber(this.balanceAmount)}</u></b>`;
                break;
            case 'payBill':
                concat = `Due Amount: <b><u>$${formatNumber(this.dueAmount)}</u></b>, <br>Paid Amount: <b><u>$${formatNumber(this.paidAmount)}</u></b>, <br>Balance: <b><u>$${formatNumber(this.balanceAmount)}</u></b>`;
                break;
            default:
                concat = `Total: <b><u>$${formatNumber(this.total)}</u></b>`;
                break;
        }
        return concat;
    },
    hasMore(count){
        return count >= Template.instance().limit.get();
    }

});
indexTmpl.onDestroyed(function () {
    dashboardTransactionData.set(false);
    tmpCollection.remove({});
});
indexTmpl.events({
    'change .select-transaction'(event, instance){
        dashboardTransactionData.set(false);
        dashboardTransactionType.set(event.currentTarget.value);
        instance.limit.set(5);
        instance.loaded.set(0);
    },
    'click .load-more': function (event, instance) {
        event.preventDefault();
        // get current value for limit, i.e. how many customer are currently displayed
        let limit = instance.limit.get();
        // increase limit by 5 and update it
        limit += 5;
        instance.limit.set(limit);
    },
});

function formatNumber(val) {
    return numeral(val).format('0,0.00');
}