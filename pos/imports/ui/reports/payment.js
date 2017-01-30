//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './payment.html';
//import DI
import  'printthis';
//import collection
import {paymentSchema} from '../../api/collections/reports/payment';

//methods
import {receivePaymentReport} from '../../../common/methods/reports/payment';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let receivePayment = new ReactiveVar();
let skip = new ReactiveVar(0);
//declare template
let indexTmpl = Template.Pos_paymentReport,
    receivePaymentTmpl = Template.paymentReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        receivePaymentReport.callPromise(paramsState.get())
            .then(function (result) {
                receivePayment.set(result);
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
    createNewAlertify('receivePaymentReport');
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return paymentSchema;
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
receivePaymentTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data(){
        if (receivePayment.get()) {
            debugger
            return receivePayment.get();
        }
    },

    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'paymentDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
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
    receivePaymentReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
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