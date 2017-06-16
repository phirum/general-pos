//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './exchangeRingPull.html';
//import DI
import  'printthis';
//import collection
import {exchangeRingPullReportSchema} from '../../api/collections/reports/exchangeRingPull';

//methods
import {exchangeRingPullReport} from '../../../common/methods/reports/exchangeRingPull';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_exchangeRingPullReport,
    invoiceDataTmpl = Template.exchangeRingPullReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        exchangeRingPullReport.callPromise(paramsState.get())
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
        return exchangeRingPullReportSchema;
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
    reduceField(){
        let td = ''
        let fieldLength = this.displayFields.length - 6;
        for (let i = 0; i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'exchangeRingPullDate') {
                data += `<td>${moment(col[obj.field]).format('DD/MM/YYYY')}</td>`
            } else if (obj.field == 'customerName') {
                data += `<td>${col.customer.name}</td>`
            } else if (obj.field == 'customerTelephone') {
                data += `<td>${col.customer.telephone ? col.customer.telephone : ''}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });

        return data;
    },
    getTotal(totalRemainQty, total){
        let string = '';
        let fieldLength = this.displayFields.length - 3;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(totalRemainQty).format('0,0')}</b></td></td><td><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    exchangeRingPullReport: {
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
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});