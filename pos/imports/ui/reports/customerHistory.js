//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './customerHistory.html';
//import DI
import  'printthis';
//import collection
import {customerHistorySchema} from '../../api/collections/reports/customerHistory';

//methods
import {customerHistoryReport} from '../../../common/methods/reports/customerHistory';
import RangeDate from "../../api/libs/date";
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_customerHistory,
    invoiceDataTmpl = Template.customerHistoryData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        customerHistoryReport.callPromise(paramsState.get())
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
    createNewAlertify('customerHistory');
    createNewAlertify('showCustomerHistory', {size: 'lg'});
    paramsState.set(FlowRouter.query.params());
    this.fromDate = new ReactiveVar(moment().startOf('days').toDate());
    this.endDate = new ReactiveVar(moment().endOf('days').toDate());
});
indexTmpl.helpers({
    schema(){
        return customerHistorySchema;
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
    'click .printReport'(event, instance){
        window.print();
    },
});

invoiceDataTmpl.onDestroyed(function () {
    $('.rpt-header').removeClass('rpt');
    $('.rpt-body').removeClass('rpt');
    $('.sub-body').removeClass('rpt rpt-body');
    $('.sub-header').removeClass('rpt rpt-header');
});
invoiceDataTmpl.onRendered(function () {
    Meteor.setTimeout(function () {
        $("table.fixed-table").fixMe();
    },1000);
});
invoiceDataTmpl.events({
    'click .displayRp'(event,instance){
        let paymentDate = moment($(event.currentTarget).attr('value')).format('DD/MM/YYYY');
        let data = invoiceData.get();
        let payments = data.payments[paymentDate].payments;
        let totalPaid = 0; 
        let totalBalance = 0 ; 
        payments.map(function(o){
            totalPaid += o.paidAmount;
            totalBalance += o.balanceAmount;
        })
        let dataObj = {totalPaid, totalBalance, payments}
        alertify.showCustomerHistory(fa('List Receive Payments', ''), renderTemplate(Template.customerHistoryShowRp,dataObj));
    }
});
invoiceDataTmpl.helpers({
    existPayment(paymentDate){
        return !!paymentDate;
    },
    hasFilterDate(date){
        let paramsFilterDate = FlowRouter.query.get('filterDate');
        let filterDate = paramsFilterDate ? moment(paramsFilterDate).startOf('months').format('DD/MM/YY') : null;
        let currentViewDate = moment(date).startOf('months');
        if (paramsFilterDate) {
            if (currentViewDate.isSameOrAfter(filterDate)) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    },
    data(){
        if (invoiceData.get()) {
            let customerHistory = invoiceData.get();
            let data = {title: customerHistory.title, content: [], footer: customerHistory.footer};
            let content = customerHistory.content;
            if (content && content.length > 0) {
                content.forEach(function (invoice) {
                    let invoiceData = invoice.data;
                    if (invoiceData.length > 0) {
                        invoiceData.forEach(function (dataDoc) {
                            let itemDoc = dataDoc.items;
                            dataDoc.firstItem = [];
                            dataDoc.secondItem = [];
                            if (itemDoc) {
                                for (let i = 0; i < itemDoc.length; i++) {
                                    if (i == 0) {
                                        dataDoc.firstItem.push(itemDoc[i]);
                                    } else {
                                        dataDoc.secondItem.push(itemDoc[i]);
                                    }
                                }
                            }
                        });
                    }
                    data.content.push(invoice);
                });

            }
            return data;
        }
    },
    displayByDay(date){
        console.log(date)
        let paymentDate = moment(date).format('DD/MM/YYYY');
        let data = invoiceData.get()
        let paymentData = data.payments[paymentDate];
        let paidAmount = 0;
        let beginningBalance = 0; 
        if(!_.isEmpty(paymentData)){
            paymentData.paids.map(function(e){
                paidAmount += e;
            })
            beginningBalance = paymentData.balance[paymentData.balance.length - 1];
        }
        return {paidAmount, beginningBalance};
    },
    firstIndex(index,date ,data){
        let paymentDate = data[index - 1 ] && data[index - 1 ].date;
        let moPaymentDate = moment(paymentDate).format('YYYY-MM-DD');
        console.log(data);
        if(!moment(moPaymentDate).isSame(moment(date).format('YYYY-MM-DD')) || data[index - 1] && data[index - 1].inv ){
            return true;
        }
        return false;
    },
    getBeginningBalance(index, balance = 0){
        let customerHistory = invoiceData.get();
        let currentMapDate = customerHistory.invoiceDateArr && customerHistory.invoiceDateArr[index];
        let subtractCurrentMapDateByOneMonth = moment(currentMapDate).subtract(1, 'months').format('YYYY-MM');
        let beginningBalance = 0;
        if (customerHistory.groupByDate.length > 0) {
            customerHistory.groupByDate.forEach(function (o) {
                let formatMonth = moment(o.invoiceDate).format('YYYY-MM');
                if (moment(formatMonth).isSame(moment(subtractCurrentMapDateByOneMonth)) || moment(formatMonth).isBefore(moment(subtractCurrentMapDateByOneMonth))) {
                    beginningBalance += o.balance;
                }
            });
        }
        return {
            balance: numeral(balance).format('0,0.00'),
            sumBalance: numeral(beginningBalance + balance).format('0,0.00'),
            beginningBalance: numeral(beginningBalance).format('0,0.00')
        };

    },
    concatInvoiceId(val){
        return val.substr(val.length - 10, val.length - 1);
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
});

Template.customerHistoryShowRp.helpers({
    data(){
        return this;
    }
});
AutoForm.hooks({
    customerHistoryReport: {
        onSubmit(doc){
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.branchId = Session.get('currentBranch');
            if (doc.date) {
                params.date = `${moment(doc.date).endOf('days').format('YYYY-MM-DD HH:mm:ss')}`;
            }
            if (doc.customer) {
                params.customer = doc.customer
            }
            if (doc.filterDate) {
                params.filterDate = moment(doc.filterDate).endOf('days').format('YYYY-MM-DD HH:mm:ss');
            }
            if (doc.branchId) {
                params.branchId = doc.branchId.join(',');
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});

//Copyright by kevin
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