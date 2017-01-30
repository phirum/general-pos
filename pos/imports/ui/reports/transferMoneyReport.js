//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './transferMoneyReport.html';
//import DI
import  'printthis';
//import collection
import {transferMoneyReport} from '../../api/collections/reports/transferMoney';

//methods
import {transferMoneyMethod} from '../../../common/methods/reports/transferMoney';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_transferMoneyReport,
    invoiceDataTmpl = Template.transferMoneyReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        transferMoneyMethod.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
                setTimeout(function () {
                    swal.close()
                }, 200);
            }).catch(function (err) {
            swal.close();
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return transferMoneyReport;
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
            if (obj.field == 'transferMoneyDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'transferAmount') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            } else if (obj.field == 'toUser') {
                data += `<td>${col[obj.field] ? col[obj.field] : 'None'}</td>`
            }
            else {
                data += `<td>${col[obj.field]}</td>`;
            }
        });
        return data;
    },
    reduceField(){
        let td = ''
        let fieldLength = this.displayFields.length - 6;
        for(let i =0 ;i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    getTotal(total){
        let string = '';
        let fieldLength = this.displayFields.length - 2;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td style="background: teal; color: #fff;"><b>TOTAL:</td></b><td  style="background: teal; color: #fff;"><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    transferMoneyReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.fromBranch) {
                params.fromBranch = doc.fromBranch;
            }
            if (doc.toBranch) {
                params.toBranch = doc.toBranch;
            }
            if (doc.filter) {
                params.filter = doc.filter.join(',');
            }
            if(doc.status) {
                params.status = doc.status.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});