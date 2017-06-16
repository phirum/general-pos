//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
//page
import './ringPullTransfer.html';
//import DI
import  'printthis';
//import collection
import {ringPullTransferReport} from '../../api/collections/reports/ringPullTransfer';

//methods
import {ringPullTransferMethods} from '../../../common/methods/reports/ringPullTransfer';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_ringPullTransferReport,
    invoiceDataTmpl = Template.ringPullTransferReportData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        ringPullTransferMethods.callPromise(paramsState.get())
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
        return ringPullTransferReport;
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
            if (obj.field == 'ringPullTransferDate') {
                data += `<td>${moment(col[obj.field]).format('YYYY-MM-DD HH:mm:ss')}</td>`
            } else if (obj.field == 'total') {
                data += `<td>${numeral(col[obj.field]).format('0,0.00')}</td>`
            } else if (obj.field == 'toStockLocation') {
                data += `<td>${col[obj.field] ? col[obj.field] : 'None'}</td>`
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
        let fieldLength = this.displayFields.length - 5;
        for(let i =0 ;i < fieldLength; i++) {
            td += '<td></td>';
        }
        return td;
    },
    getTotal(total){
        let string = '';
        let fieldLength = this.displayFields.length - 5;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td style="background: teal; color: #fff;"><b>TOTAL:</td></b><td  style="background: teal; color: #fff;"><b>${numeral(total).format('0,0.00')}</b></td>`;
        return string;
    }
});


AutoForm.hooks({
    ringPullTransferReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            if (doc.fromDate && doc.toDate) {
                let fromDate = moment(doc.fromDate).startOf('days').format('YYYY-MM-DD HH:mm:ss');
                let toDate = moment(doc.toDate).endOf('days').format('YYYY-MM-DD HH:mm:ss');
                params.date = `${fromDate},${toDate}`;
            }
            if (doc.fromBranch) {
                params.fromBranch = doc.fromBranch;
            }
            if (doc.fromLocation) {
                params.fromLocation = doc.fromLocation;
            }
            if (doc.toBranch) {
                params.toBranch = doc.toBranch;
            }
            if (doc.toLocation) {
                params.toLocation = doc.toLocation;
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