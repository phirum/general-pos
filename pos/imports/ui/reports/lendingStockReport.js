//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './lendingStockReport.html';
//import DI
import  'printthis';
//import collection
import {exchangeGratisReportSchema} from '../../api/collections/reports/exchangeGratis';

//methods
import {lendingStockReport} from '../../../common/methods/reports/lendingStock';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_lendingStockReport,
    invoiceDataTmpl = Template.lendingStockReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        lendingStockReport.callPromise(paramsState.get())
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
        return exchangeGratisReportSchema;
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
        let fieldLength = this.displayFields.length - 7;
        for (let i = 0; i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    display(col){
        let data = '';
        this.displayFields.forEach(function (obj) {
            if (obj.field == 'lendingStockDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'vendor') {
                data += `<td>${col.vendor.name}</td>`;
            } else if (obj.field == 'vendorTelephone') {
                let tel = col.vendor.telephone;
                data += `<td>${ tel ? tel : ''}</td>`;
            } else if (obj.field == 'total') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else {
                data += `<td>${col[obj.field] ? col[obj.field] : ''}</td>`;
            }
        });

        return data;
    },
    getTotal(totalRemainQty, remainAmount, total){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td><b>Total:</td></b><td><b>${numeral(totalRemainQty).format('0,0')}</b></td></td><td><b>${numeral(remainAmount).format('0,0.00')}</b></td><td><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    lendingStockReport: {
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
            if (doc.status) {
                params.status = doc.status.join(',');
            }
            if (doc.vendor) {
                params.vendor = doc.vendor
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