//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './stockDetail.html';
//import DI
import  'printthis';
import {JSPanel} from '../../api/libs/jspanel';
//import collection
import {stockDetailSchema} from '../../api/collections/reports/stockDetail';

//methods
import {stockDetailReportMethod} from '../../../common/methods/reports/stockDetail';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_stockDetailReport,
    invoiceDataTmpl = Template.stockDetailReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        stockDetailReportMethod.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
                setTimeout(function () {
                    swal.close();
                }, 200);
            }).catch(function (err) {
            swal.close();
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
});
indexTmpl.helpers({
    schema(){
        return stockDetailSchema;
    },
    startDate(){
        let instance = Template.instance();
        return instance.fromDate.get();
    },
    endDate(){
        let instance = Template.instance();
        return instance.endDate.get();
    }
});
indexTmpl.events({
    'click .print'(event, instance){
        window.print();
    },
    'change #date-range-filter'(event, instance){
        let currentRangeDate = RangeDate[event.currentTarget.value]();
        instance.fromDate.set(currentRangeDate.start.toDate());
        instance.endDate.set(currentRangeDate.end.toDate());
    },
    'click .fullScreen'(event, instance){
        $('.rpt-header').addClass('rpt');
        $('.rpt-body').addClass('rpt');
        $('.sub-body').addClass('rpt rpt-body');
        $('.sub-header').addClass('rpt rpt-header');
        let arrFooterTool = [
            {
                item: "<button type='button'></button>",
                event: "click",
                btnclass: 'btn btn-sm btn-primary',
                btntext: 'Print',
                callback: function (event) {
                    setTimeout(function () {
                        $('#to-printStockDetail').printThis();
                    }, 500);
                }
            }
        ];
        JSPanel({
            footer: arrFooterTool,
            title: 'Stock Detail',
            content: renderTemplate(invoiceDataTmpl).html
        }).maximize();
    }
});
invoiceDataTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    concat(num){
        if (num && num.includes('-')) {
            return num.substr(num.length - 10, num.length - 1);
        }
        return num;
    },
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    displayStockOutQty(){
        if (this.coefficient < 0) {
            return `<td></td><td>${numeral(Math.abs(this.qty)).format('0,0.00')}</td>`;
        }
        return `<td>${numeral(this.qty).format('0,0.00')}</td><td></td>`;
    }
});
invoiceDataTmpl.onDestroyed(function () {
    $('.rpt-header').removeClass('rpt');
    $('.rpt-body').removeClass('rpt');
    $('.sub-body').removeClass('rpt rpt-body');
    $('.sub-header').removeClass('rpt rpt-header');
});

AutoForm.hooks({
    stockDetailReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branch = Session.get('currentBranch');
            if (doc.startDate && doc.endDate) {
                params.date = `${moment(doc.startDate).startOf('days').format('YYYY-MM-DD')}, ${moment(doc.endDate).endOf('days').format('YYYY-MM-DD')}`;
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if (doc.items) {
                params.items = doc.items.join(',')
            }
            if (doc.branch) {
                params.branch = doc.branch.join(',');
            }
            if (doc.location) {
                params.location = doc.location.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});