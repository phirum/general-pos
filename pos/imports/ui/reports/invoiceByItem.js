//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './invoiceByItem.html';
//import DI
import  'printthis';
//import collection
import {invoiceSchema} from '../../api/collections/reports/invoice';
//methods
import {invoiceByItemReport} from '../../../common/methods/reports/invoiceByItem';
//import from lib
import RangeDate from '../../api/libs/date';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_invoiceByItemReport,
    invoiceDataTmpl = Template.invoiceByItemReportData;
let showItemsSummary = new ReactiveVar(true);
let showInvoicesSummary = new ReactiveVar(true);
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        invoiceByItemReport.callPromise(paramsState.get())
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
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
    createNewAlertify('invoiceByItemReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return invoiceSchema;
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
        // $('#to-print').printThis();
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
    },
    'click .fullScreen'(event, instance){
        $('.rpt-body').addClass('rpt');
        $('.rpt-header').addClass('rpt');
        alertify.invoiceByItemReport(fa('',''), renderTemplate(invoiceDataTmpl)).maximize();
    }
});
invoiceDataTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    }
});
invoiceDataTmpl.onDestroyed(function () {
    $('.rpt-body').removeClass('rpt');
    $('.rpt-header').removeClass('rpt');
});
invoiceDataTmpl.helpers({
    showItemsSummary(){
        return showItemsSummary.get();
    },
    showInvoicesSummary(){
        return showInvoicesSummary.get();
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data(){
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },

    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'date') {
                data += `<td>${moment(col[obj.field]).format('DD/MM/YYYY')}</td>`
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'qty' || obj.field == 'price' || obj.field == 'total' || obj.field == 'amount') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field] || ''}</td>`;
            }
        });

        return data;
    },
    getTotal(total){
        let string = '';
        let fieldLength = this.displayFields.length - 2;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><u>Total:</u></td><td><u>${numeral(total).format('0,0.00')}</u></td>`;
        return string;
    },
    getTotalFooter(totalQty, total, n){
        let qty = totalQty ? totalQty : '';
        let string = '';
        let fieldLength = this.displayFields.length - n;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</b></td><td class="text-right"><b>${numeral(qty).format('0,0.00')}</b></td><td></td><td class="text-right"><b>${numeral(total).format('0,0.00')}$</b></td>`;
        return string;
    },
    capitalize(customerName){
        return _.capitalize(customerName);
    }
});


AutoForm.hooks({
    invoiceReport: {
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
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if(doc.branchId) {
                params.branchId = doc.branchId.join(',');
            }
            if(doc.itemId){
                params.itemId = doc.itemId;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});