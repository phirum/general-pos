//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './ringpullDetail.html';
//import DI
import  'printthis';
//import collection
import {ringpullDetail} from '../../api/collections/reports/ringpullDetail';

//methods
import {ringpullDetailReport} from '../../../common/methods/reports/ringpullDetail';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_ringpullDetailReport,
    invoiceDataTmpl = Template.ringpullDetailReportData;
let showItemsSummary = new ReactiveVar(true);
let showInvoicesSummary = new ReactiveVar(true);
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        ringpullDetailReport.callPromise(paramsState.get())
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
        return ringpullDetail;
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
    hasFilterDate(date){
        let paramsFilterDate = FlowRouter.query.get('filterDate');
        let filterDate = paramsFilterDate ? moment(paramsFilterDate).startOf('days').format('YYYY-MM-DD') : null;
        let currentViewDate = moment(date).startOf('months');
        if (paramsFilterDate) {
            if (currentViewDate.isSameOrAfter(filterDate)) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    },
    isZero(val){
        if (val == 0) {
            return ''
        }
        return numeral(val).format('0,0.00');
    },
    showItemsSummary(){
        return showItemsSummary.get();
    },
    showInvoicesSummary(){
        return showInvoicesSummary.get();
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc && doc.company;
    },
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },

    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'vendorId') {
                data += `<td>${col._vendor.name}</td>`
            } else if (obj.field == 'date' && col.type) {
                console.log(col[obj.field]);
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`;
            } else if (obj.field == 'total') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field] || ''}</td>`;
            }
        });

        return data;
    },
    getTotal(total, customerName){
        let string = '';
        let fieldLength = this.displayFields.length - 2;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><u>Total ${_.capitalize(customerName)}:</u></td><td><u>${numeral(total).format('0,0.00')}</u></td>`;
        return string;
    },
    getTotalFooter(totalQty, total, n){
        let string = '';
        let fieldLength = this.displayFields.length - n;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(totalQty).format('0,0')}</b></td><td></td><td><b>${numeral(total).format('0,0.00')}$</b></td>`;
        return string;
    },
    capitalize(customerName){
        return _.capitalize(customerName);
    }
});


AutoForm.hooks({
    ringpullDetailReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.asDate) {
                params.date = `${moment(doc.asDate).endOf('days').format('YYYY-MM-DD')}`;
            }
            if (doc.viewDate) {
                params.filterDate = `${moment(doc.viewDate).endOf('days').format('YYYY-MM-DD HH:ss')}`
            }
            if (doc.branchId) {
                params.branchId = doc.branchId;
            }
            if (doc.itemId) {
                params.itemId = doc.itemId;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});