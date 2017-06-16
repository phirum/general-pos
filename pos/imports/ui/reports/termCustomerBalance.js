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
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
});
indexTmpl.helpers({
    schema(){
        return customerTermBalanceSchema;
    }
});
indexTmpl.events({
    'click .printReport'(event,instance){
        window.print();
    }
});
invoiceDataTmpl.onRendered(function () {
    Meteor.setTimeout(function () {
        $("table.fixed-table").fixMe();
    }, 1000)
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
                if (col[obj.field] == 'None') {
                    data += `<td>${col[obj.field]}</td>`
                } else {
                    data += `<td>${moment(col[obj.field]).format('DD/MM/YY')}</td>`
                }
            } else if (obj.field == 'customerId') {
                data += `<td>${col._customer.name}</td>`
            } else if (obj.field == 'dueAmount' || obj.field == 'paidAmount' || obj.field == 'balance') {
                data += `<td class="text-right">${numeral(col[obj.field]).format('0,0.00')}</td>`
            }
            else if (obj.field == 'dueDate') {
                let date = FlowRouter.query.get('date');
                let currentDate = moment( (date && date) || "");
                let dueDate = moment(col[obj.field]);
                let diffDay = currentDate.diff(dueDate, 'days');
                if (currentDate.isAfter(dueDate) && diffDay != 0) {
                    data += `<td>${diffDay}</td>`
                } else {
                    data += `<td></td>`
                }
            }else if(obj.field == '_id'){
                let val = col[obj.field];
                data += `<td>${val.substr(val.length - 10 , val.length -1)}</td>`
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
    getTotalFooter(totalDue, totalPaid, totalBalance){
        let string = '';
        let fieldLength = this.displayFields.length - 4;
        for (let i = 0; i < fieldLength; i++) {
            string += '<td></td>'
        }
        string += `<td style="border-top: 1px solid black;"><b>Total:</td></b><td style="border-top: 1px solid black;" class="text-right"><b>${numeral(totalDue).format('0,0.00')}</b></td><td style="border-top: 1px solid black;" class="text-right"><b>${numeral(totalPaid).format('0,0.00')}</b></td><td style="border-top: 1px solid black;" class="text-right"><b>${numeral(totalBalance).format('0,0.00')}</b></td>`;
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
            params.type="active";
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
            if(doc.branchId) {
                params.branchId = doc.branchId.join(',');
            }
            if(doc.invoiceType){
                params.iType=doc.invoiceType;
            }
            if(doc.type){
                params.type = doc.type;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});
$.fn.fixMe = function () {
    return this.each(function () {
        var $this = $(this),
            $t_fixed;

        function init() {
            $this.wrap('<div class="container-fix-header" />');
            $t_fixed = $this.clone();
            $t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
            resizeFixed();
        }

        function resizeFixed() {
            $t_fixed.find("th").each(function (index) {
                $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
            });
        }

        function scrollFixed() {
            var offset = $(this).scrollTop(),
                tableOffsetTop = $this.offset().top,
                tableOffsetBottom = tableOffsetTop + $this.height() - $this.find("thead").height();
            if (offset < tableOffsetTop || offset > tableOffsetBottom)
                $t_fixed.hide();
            else if (offset >= tableOffsetTop && offset <= tableOffsetBottom && $t_fixed.is(":hidden"))
                $t_fixed.show();
        }

        $(window).resize(resizeFixed);
        $(window).scroll(scrollFixed);
        init();
    });
}