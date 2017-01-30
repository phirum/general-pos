//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './unpaidGroupInoviceOverdue.html';
//import DI
import  'printthis';
//import collection
import {unpaidGroupInvoiceOverdueSchema} from '../../api/collections/reports/unpaidGroupInvoiceOverdue';

//methods
import {unpaidGroupInvoiceOverdue} from '../../../common/methods/reports/unpaidGroupInvoiceOverdue';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_unpaidGroupInvoiceOverdue,
    invoiceDataTmpl = Template.unpaidGroupInvoiceOverdueData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        unpaidGroupInvoiceOverdue.callPromise(paramsState.get())
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
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return unpaidGroupInvoiceOverdueSchema;
    }
});
indexTmpl.events({
    'click .print'(event, instance){
        $('#to-print').printThis();
    }
});
invoiceDataTmpl.helpers({
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
            if (obj.field == 'invoiceDate' || obj.field == 'dueDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'total' || obj.field == 'dueAmount' || obj.field == 'paidAmount' || obj.field == 'balanceAmount') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });

        return data;
    },
    getTotal(dueAmount, paidAmount, balanceAmount, customerName){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `
                <td><u>Total ${_.capitalize(customerName)}:</u></td>
                <td><u>${numeral(dueAmount).format('0,0.00')}</u></td>
                <td><u>${numeral(paidAmount).format('0,0.00')}</u></td>
                <td><u>${numeral(balanceAmount).format('0,0.00')}</u></td>
                `;
        return string;
    },
    getTotalFooter(total, totalKhr, totalThb){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(totalKhr).format('0,0')}<small>៛</small></b></td><td><b>${numeral(totalThb).format('0,0')}B</b></td><td><b>${numeral(total).format('0,0.00')}$</b></td>`;
        return string;
    },
    capitalize(customerName){
        return _.capitalize(customerName);
    }
});


AutoForm.hooks({
    unpaidGroupInvoiceOverdueReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.date) {
                let date = moment(doc.date).format('YYYY-MM-DD HH:mm:ss');
                params.date = `${date}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});