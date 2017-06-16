//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './payBill.html';
//import DI
import  'printthis';
//import collection
import {payBillSchema} from '../../api/collections/reports/payBill';

//methods
import {payBillReport} from '../../../common/methods/reports/payBill';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let payBill = new ReactiveVar();
let skip = new ReactiveVar(0);
//declare template
let indexTmpl = Template.Pos_payBillReport,
    payBillTmpl = Template.payBillReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        payBillReport.callPromise(paramsState.get())
            .then(function (result) {
                payBill.set(result);
                setTimeout(function () {
                    swal.close()
                }, 200);
            }).catch(function (err) {
            swal.close();
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('payBillReport');
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return payBillSchema;
    },
    fromDate(){
        let instance = Template.instance();
        return instance.fromDate.get();
    },
    endDate(){
        let instance = Template.instance();
        return instance.endDate.get();
    }
});
indexTmpl.events({
    'change #date-range-filter'(event, instance){
        let currentRangeDate = RangeDate[event.currentTarget.value]();
        instance.fromDate.set(currentRangeDate.start.toDate());
        instance.endDate.set(currentRangeDate.end.toDate());
    },
    'click .print'(event, instance){
        $('#to-print').printThis();
    },
    'click .next'(event, instance){
        let currentParams = FlowRouter.query.params();
        let totalSkip = skip.get() + parseInt($('[name="skip"]').val());
        skip.set(totalSkip);
        currentParams.skip = totalSkip;
        currentParams.limit = parseInt($('[name="limit"]').val());
        FlowRouter.query.unset();
        FlowRouter.query.set(currentParams);
        paramsState.set(FlowRouter.query.params());
    },
    'click .previous'(event, instance){
        let previousSkip = skip.get() - parseInt($('[name="skip"]').val());
        let currentParams = FlowRouter.query.params();
        let totalSkip = previousSkip < 0 ? 0 : previousSkip;
        skip.set(totalSkip);
        currentParams.skip = totalSkip;
        currentParams.limit = parseInt($('[name="limit"]').val());
        FlowRouter.query.unset();
        FlowRouter.query.set(currentParams);
        paramsState.set(FlowRouter.query.params());
    },
    'change [name="limit"]'(event, instance){
        let limit = parseInt(event.currentTarget.value);
        let currentParams = FlowRouter.query.params();
        let totalSkip = skip.get();
        currentParams.skip = totalSkip;
        currentParams.limit = limit;
        FlowRouter.query.unset();
        FlowRouter.query.set(currentParams);
        paramsState.set(FlowRouter.query.params());
    }
});
payBillTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data(){
        if (payBill.get()) {
            debugger
            return payBill.get();
        }
    },

    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'paymentDate') {
                data += `<td>${moment(col[obj.field]).format('DD/MM/YYYY')}</td>`
            } else if (obj.field == 'vendorId') {
                data += `<td>${col._vendor && col._vendor.name}</td>`
            } else if (obj.field == 'actualDueAmount' || obj.field == 'dueAmount' || obj.field == 'paidAmount' || obj.field == 'balanceAmount') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });
        return data;
    },
    getTotal(dueAmount, paidAmount, balanceAmount){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(dueAmount).format('0,0.00')}</b></td>`;
        string += `<td><b>${numeral(paidAmount).format('0,0.00')}</b></td>`;
        string += `<td><b>${numeral(balanceAmount).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    payBillReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).startOf('days').format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).endOf('days').format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.vendorId) {
                params.vendorId = doc.vendorId;
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if(doc.branchId) {
                params.branchId = doc.branchId.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});