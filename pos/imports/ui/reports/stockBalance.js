//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './stockBalance.html';
//import DI
import  'printthis';
//import collection
import {stockBalanceSchema} from '../../api/collections/reports/stockBalance';

//methods
import {stockBalanceReport} from '../../../common/methods/reports/stockBalanceReport';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_stockBalanceReport,
    invoiceDataTmpl = Template.stockBalanceReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        stockBalanceReport.callPromise(paramsState.get())
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
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return stockBalanceSchema;
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
            debugger
            return invoiceData.get();
        }
    },
    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'invoiceDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'averagePrice' || obj.field == 'lastAmount') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0.00')}</td>`
            }else if(obj.field == 'remainQty') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0')}</td>`;
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });
        return data;
    },
    getTotal(total, totalRemainQty){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td style="border-top: 1px solid black;" class="text-right"><b>${numeral(totalRemainQty).format('0,0')}</b></td><td style="border-top: 1px solid black" class="text-right"><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    balanceReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.asOfDate) {
                let asOfDate = moment(doc.asOfDate).format('YYYY-MM-DD 23:59:59');
                params.date = `${asOfDate}`;
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if (doc.items) {
                params.items = doc.items.join(',')
            }
            if (doc.branch) {
                params.branch = doc.branch.join(',');
            }
            if (doc.location) {
                params.location = doc.location.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});