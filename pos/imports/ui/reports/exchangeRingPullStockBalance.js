//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './exchangeRingPullStockBalance.html';
//import DI
import  'printthis';
//import collection
import {exchangeRingPullStockBalanceSchema} from '../../api/collections/reports/exchangeRingPullStockBalance';

//methods
import {exchangeRingPullStockBalanceReport} from '../../../common/methods/reports/exchangeRingPullStockBalance';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_exchangeRingPullStockBalance,
    invoiceDataTmpl = Template.exchangeRingPullStockBalanceData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        exchangeRingPullStockBalanceReport.callPromise(paramsState.get())
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
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return exchangeRingPullStockBalanceSchema;
    }
});
indexTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    }
});
invoiceDataTmpl.helpers({
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    }
});


AutoForm.hooks({
    exchangeRingPullStockBalance: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};

            if (doc.items) {
                params.items = doc.items.join(',')
            }
            if (doc.branch) {
                params.branch = doc.branch.join(',');
            }
            if (doc.asDate) {
                params.date = doc.asDate;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});