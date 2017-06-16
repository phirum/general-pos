//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './vendorBalance.html';
//import DI
import  'printthis';
//import collection
import {vendorBalanceSummary} from '../../api/collections/reports/vendorBalance';
import './vendorBalance.html';
//methods
import {VendorBalanceSummary} from '../../../common/methods/reports/vendorBalanceSummary';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.pos_vendorBalanceSummaryReport,
    invoiceDataTmpl = Template.vendorBalanceSummaryReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        VendorBalanceSummary.callPromise(paramsState.get())
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
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return vendorBalanceSummary;
    }
});
indexTmpl.events({});

invoiceDataTmpl.events({
    'click .print'(event,instance){
        window.print();
    }
});
invoiceDataTmpl.helpers({
    data(){
        return invoiceData.get();
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc && doc.company;
    }
});

AutoForm.hooks({
    vendorBalanceSummary: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.vendorId) {
                params.vendorId = doc.vendorId;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});
