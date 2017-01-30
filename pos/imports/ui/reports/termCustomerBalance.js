//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './termCustomerBalance.html';
//import DI
import  'printthis';
//import collection
import {customerTermBalanceSchema} from '../../api/collections/reports/customerTermBalance';

//methods
import {termCustomerBalanceReport} from '../../../common/methods/reports/termCustomerBalance';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_termCustomerBalance,
    invoiceDataTmpl = Template.termCustomerBalanceData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        termCustomerBalanceReport.callPromise(paramsState.get())
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
    createNewAlertify('customerTermBalance');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return customerTermBalanceSchema;
    }
});
indexTmpl.events({
    'click .fullScreen'(event,instance){
        $('.sub-body').addClass('rpt rpt-body');
        $('.sub-header').addClass('rpt rpt-header');
        alertify.customerTermBalance(fa('', ''), renderTemplate(invoiceDataTmpl)).maximize();
    }
});
invoiceDataTmpl.onDestroyed(function () {
    $('.sub-body').removeClass('rpt rpt-body');
    $('.sub-header').removeClass('rpt rpt-header');
});
invoiceDataTmpl.events({
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
            if (obj.field == 'invoiceDate' || obj.field == 'lastPaymentDate') {
                if(col[obj.field] == 'None'){
                    data += `<td>${col[obj.field]}</td>`
                }else{
                    data += `<td>${moment(col[obj.field]).format('YYYY/MM/DD')}</td>`
                }
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'dueAmount' || obj.field == 'paidAmount' || obj.field == 'balance') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else if(obj.field == 'items'){
                let itemString = '';
                col[obj.field].forEach(function (item) {
                    itemString += `${item.itemName} ${numeral(item.qty).format('0,0')} x${numeral(item.price).format('0,0.00')}$ = ${numeral(item.amount).format('0,0.00')}$, `;
                });
                data+=`<td>${itemString}</td>`;
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });

        return data;
    },
    getTotal(dueAmount, paidAmount, total, customerName){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><u>Total ${_.capitalize(customerName)}:</u></td><td class="text-right"><u>${numeral(dueAmount).format('0,0.00')}</u></td><td class="text-right"><u>${numeral(paidAmount).format('0,0.00')}</u></td><td class="text-right"><u>${numeral(total).format('0,0.00')}</u></td>`;
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
    termCustomerBalanceReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.date) {
                let formatDate = moment(doc.date).format('YYYY-MM-DD');
                params.date = `${formatDate}`;
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