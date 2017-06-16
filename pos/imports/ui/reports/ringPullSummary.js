//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './ringPullSummary.html';
//import DI
import  'printthis';
//import collection
import {ringPullSummary} from '../../api/collections/reports/ringPullSummary';

//methods
import {ringPullSummaryReport} from '../../../common/methods/reports/ringPullSummary';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_ringPullSummaryReport,
    invoiceDataTmpl = Template.ringPullSummaryReportData;
let showItemsSummary = new ReactiveVar(true);
let showInvoicesSummary = new ReactiveVar(true);
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        ringPullSummaryReport.callPromise(paramsState.get())
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
        return ringPullSummary;
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
    ringPullSummaryReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
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