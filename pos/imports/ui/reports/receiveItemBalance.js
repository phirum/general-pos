//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './receiveItemBalance.html';
//import DI
import  'printthis';
//import collection
import {receiveItemBalance} from '../../api/collections/reports/receiveItemBalance';

//methods
import {receiveItemBalanceReport} from '../../../common/methods/reports/receiveItemBalance';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_receiveItemBalanceReport,
    invoiceDataTmpl = Template.receiveItemBalanceReportData;
let showItemsSummary = new ReactiveVar(true);
let showInvoicesSummary = new ReactiveVar(true);
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        receiveItemBalanceReport.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
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
    createNewAlertify('invoiceReport');
    Session.set('vendorFilter', 'Term');
    paramsState.set(FlowRouter.query.params());
});

indexTmpl.onDestroyed(function () {
    Session.set('vendorFilter', undefined);
});

indexTmpl.helpers({
    schema(){
        return receiveItemBalance;
    }
});

indexTmpl.events({
    'click .print'(event, instance){
        window.print();
    },
    'change [name="type"]'(event, instance){
        Session.set('vendorFilter', event.currentTarget.value);
    },
    'change .show-items-summary'(event, instance){
        if ($(event.currentTarget).prop('checked')) {
            showItemsSummary.set(true);
        } else {
            showItemsSummary.set(false);
        }
    },
    'change .show-invoices-summary'(event, instance){
        if ($(event.currentTarget).prop('checked')) {
            showInvoicesSummary.set(true);
        } else {
            showInvoicesSummary.set(false);
        }
    }

});
invoiceDataTmpl.helpers({
    isZero(val){
        if(val == 0) {
            return ''
        }
        return numeral(val).format('0,0.00');
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    }
});


AutoForm.hooks({
    receiveItemBalanceReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if(doc.receiveType) {
                params.receiveType = doc.receiveType;
            }
            if(doc.asDate) {
                params.asDate = `${moment(doc.asDate).startOf('days').format('YYYY-MM-DD')}`;
            }
            if(doc.branchId) {
                params.branchId = doc.branchId;
            }
            if(doc.itemId) {
                params.itemId = doc.itemId.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});