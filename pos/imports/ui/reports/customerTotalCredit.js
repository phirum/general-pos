//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './customerTotalCredit.html';
//import DI
import  'printthis';
//import collection
import {customerTermBalanceSchema} from '../../api/collections/reports/customerTermBalance';
import {JSPanel} from '../../api/libs/jspanel';
//methods
import {customerTotalCreditReport} from '../../../common/methods/reports/customerTotalCredit';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_customerTotalCredit,
    invoiceDataTmpl = Template.customerTotalCreditData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        customerTotalCreditReport.callPromise(paramsState.get())
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
    createNewAlertify('customerTotalCredit');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return customerTermBalanceSchema;
    }
});
indexTmpl.events({
    'click .fullScreen'(event, instance){
        $('.sub-body').addClass('rpt rpt-body');
        $('.sub-header').addClass('rpt rpt-header');
        let arrFooterTool = [
            {
                item: "<button type='button'></button>",
                event: "click",
                btnclass: 'btn btn-sm btn-primary',
                btntext: 'Print',
                callback: function (event) {
                    setTimeout(function () {
                        $('#customer-total-credit-print').printThis();
                    }, 500);
                }
            }
        ];
        JSPanel({footer: arrFooterTool,title: 'Total Credit', content: renderTemplate(invoiceDataTmpl).html}).maximize();

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

    displayField(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if(obj.field == 'amountDue') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0.00')}</td>`;
            }else{
                data += `<td>${col[obj.field]}</td>`;
            }
        });
        return data;
    },
    getTotal(dueAmount, paidAmount, total, customerName){
        let string = '';
        let fieldLength = this.displayFields.length - 5;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><u>Total ${_.capitalize(customerName)}:</u></td><td class="text-right"><u>${numeral(dueAmount).format('0,0.00')}</u></td><td class="text-right"><u>${numeral(paidAmount).format('0,0.00')}</u></td><td class="text-right"><u>${numeral(total).format('0,0.00')}</u></td>`;
        return string;
    },
    getTotalFooter(total){
        let string = '';
        let fieldLength = this.displayFields.length - 2;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td ><b>Total:</td></b><td style="border-top: 1px solid black;" class="text-right"><b>${numeral(total).format('0,0.00')}$</b></td>`;
        return string;
    },
    capitalize(customerName){
        return _.capitalize(customerName);
    }
});


AutoForm.hooks({
    customerTotalCreditReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
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
            if(doc.sortBy && doc.sortBy != '') {
                params.sortBy = doc.sortBy;
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