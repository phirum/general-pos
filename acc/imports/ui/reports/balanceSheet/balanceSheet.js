import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {AutoForm} from 'meteor/aldeed:autoform';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import 'meteor/theara:autoprint';
import {DateTimePicker} from 'meteor/tsega:bootstrap3-datetimepicker';


// Component
import '../../../../../core/imports/ui/layouts/report/content.html';
import '../../../../../core/imports/ui/layouts/report/sign-footer.html';
import '../../../../../core/client/components/loading.js';
import '../../../../../core/client/components/form-footer.js';


//Lib
import {createNewAlertify} from '../../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {__} from '../../../../../core/common/libs/tapi18n-callback-helper.js';


// Method
// import '../../../../common/methods/reports/balanceSheet.js';
import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {BalanceSheetSchema} from '../../../../imports/api/collections/reports/balanceSheet.js';

// Page
import './balanceSheet.html';
// Declare template
var reportTpl = Template.acc_balanceSheetReport,
    generateTpl = Template.acc_balanceSheetReportGen,
    generateTplForAll = Template.acc_balanceSheetForAllReportGen,
    tmplPrintData = Template.acc_balanceSheetReportPrintData,
    tmplPrintDataForAll = Template.acc_balanceSheetForAllReportPrintData;

reportTpl.onRendered(function () {
    switcherFun();
})

reportTpl.helpers({
    schema() {
        return BalanceSheetSchema;
    }
})

//===================================Run
// Form state
let formDataState = new ReactiveVar(null);
let formDataStateForAllCurency = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);

let rptInitStateForAllCurrency = new ReactiveVar(false);
let rptDataStateForAllCurrency = new ReactiveVar(null);


reportTpl.onCreated(function () {
    this.autorun(() => {


        // Check form data
        if (formDataState.get()) {
            createNewAlertify('acc_balanceSheetReport');

            rptInitState.set(true);
            rptDataState.set(null);

            rptInitStateForAllCurrency.set(false);
            rptDataStateForAllCurrency.set(null);
            let params = formDataState.get();

            Meteor.call('acc_BalanceSheet', params, function (err, result) {
                if (result) {
                    rptDataState.set(result);
                } else {
                    console.log(err.message);
                }
            })
        }

        // Check form data
        if (formDataStateForAllCurency.get()) {
            createNewAlertify('acc_balanceSheetReportForAllCurrency');

            rptInitStateForAllCurrency.set(true);
            rptDataStateForAllCurrency.set(null);

            rptInitState.set(false);
            rptDataState.set(null);
            let params = formDataStateForAllCurency.get();

            Meteor.call('acc_BalanceSheetMulti', params, function (err, result) {
                if (result) {
                    rptDataStateForAllCurrency.set(result);
                } else {
                    console.log(err.message);
                }
            })
        }

    });
});


tmplPrintData.helpers({
    rptInit(){
        if (rptInitState.get() == true) {
            return rptInitState.get();
        } else {
            return rptInitState.get();
        }
    },
    rptData: function () {
        return rptDataState.get();
    }
});

tmplPrintData.events({
    'dblclick .transactionDetail'(e,t){

        let self=this;
        let pa={};
        let datePick=$("[name='date']").val();
        let startDate=moment(moment(datePick,"DD/MM/YYYY").startOf('months').toDate()).format("DD/MM/YYYY");
        let dateRange=startDate+" - "+moment(datePick,"DD/MM/YYYY").format("DD/MM/YYYY");

        pa.branchId=$("[name='branchId']").val();
        pa.currencyId=$("[name='currencyId']").val();
        pa.exchangeDate=$("[name='exchangeDate']").val();
        pa.dateRange=dateRange;

        pa.chartAccount=self.account;
        pa.accountType=['10','11','12','20','21','30'];

        var path='/acc/transactionDetailReport?branchId='+pa.branchId+'&accountType='+
            pa.accountType+'&chartAccount='+pa.chartAccount
            +'&date='+pa.dateRange+'&exchangeDate='+pa.exchangeDate
            +'&currencyId='+pa.currencyId;

        window.open(path,'_blank');

    }
});


tmplPrintDataForAll.helpers({
    rptInit(){
        if (rptInitStateForAllCurrency.get() == true) {
            return rptInitStateForAllCurrency.get();
        } else {
            return rptInitStateForAllCurrency.get();
        }
    },
    rptData: function () {
        return rptDataStateForAllCurrency.get();
    }
});

tmplPrintDataForAll.events({
    'dblclick .transactionDetail'(e,t){

        let self=this;
        let pa={};
        let datePick=$("[name='date']").val();
        let startDate=moment(moment(datePick,"DD/MM/YYYY").startOf('months').toDate()).format("DD/MM/YYYY");
        let dateRange=startDate+" - "+moment(datePick,"DD/MM/YYYY").format("DD/MM/YYYY");

        pa.branchId=$("[name='branchId']").val();
        pa.currencyId=$("[name='currencyId']").val();
        pa.exchangeDate=$("[name='exchangeDate']").val();
        pa.dateRange=dateRange;

        pa.chartAccount=self.account;
        pa.accountType=['10','11','12','20','21','30'];

        var path='/acc/transactionDetailReport?branchId='+pa.branchId+'&accountType='+
            pa.accountType+'&chartAccount='+pa.chartAccount
            +'&date='+pa.dateRange+'&exchangeDate='+pa.exchangeDate
            +'&currencyId='+pa.currencyId;

        window.open(path,'_blank');

    }
});


reportTpl.events({
    'click .run ': function (e, t) {

        let result = {};
        result.branchId = $('[name="branchId"]').val();
        result.date = $('[name="date"]').val();
        result.currencyId = $('[name="currencyId"]').val();
        result.exchangeDate = $('[name="exchangeDate"]').val();
        result.showNonActive = $('[name="showNonActive"]').is(":checked");

        if (result.exchangeDate == "") {
            alertify.warning("Exchange is Required!!!");
            return false;
        }

        if (result.currencyId == "All") {
            formDataStateForAllCurency.set(result);
            formDataState.set(null);
        } else {
            formDataState.set(result);
            formDataStateForAllCurency.set(null);
        }

    },
    'change [name="accountType"]': function (e) {
        Session.set('accountTypeIdSession', $(e.currentTarget).val());
    },
    'click .fullScreen'(event, instance){
        if(rptInitStateForAllCurrency.get() == true){
            alertify.acc_balanceSheetReportForAllCurrency(fa('', ''), renderTemplate(tmplPrintDataForAll)).maximize();
        }else {
            alertify.acc_balanceSheetReport(fa('', ''), renderTemplate(tmplPrintData)).maximize();
        }
    },
    'click .btn-print'(event, instance){
        $('#print-data').printThis();
    }
});


reportTpl.onDestroyed(function () {
    formDataState.set(null);
    rptDataState.set(null);
    rptInitState.set(false);

    formDataStateForAllCurency.set(null);
    rptDataStateForAllCurrency.set(null);
    rptInitStateForAllCurrency.set(false);
});


// hook
let hooksObject = {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
        debugger;
        this.event.preventDefault();
        formDataState.set(null);

        this.done(null, insertDoc);

    },
    onSuccess: function (formType, result) {
        formDataState.set(result);

        // $('[name="branchId"]').val(result.branchId);
        // $('[name="creditOfficerId"]').val(result.creditOfficerId);
        // $('[name="paymentMethod"]').val(result.paymentMethod);
        // $('[name="currencyId"]').val(result.currencyId);
        // $('[name="productId"]').val(result.productId);
        // $('[name="locationId"]').val(result.locationId);
        // $('[name="fundId"]').val(result.fundId);
        // $('[name="classifyId"]').val(result.classifyId);
        //
        // $('[name="date"]').val(moment(result.date).format("DD/MM/YYYY"));
        // $('[name="exchangeId"]').val(result.exchangeId);
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};


// ===============================Generate


generateTplForAll.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    },
    dataMain: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        var callId = JSON.stringify(q);

        var call = Meteor.callAsync(callId, 'acc_BalanceSheetMulti', q);

        if (!call.ready()) {
            return false;
        }

        return call.result();


        /* Fetcher.setDefault('data', false);
         Fetcher.retrieve('data', 'acc_BalanceSheetMulti', q);

         return Fetcher.get('data');*/

    }
});

generateTpl.helpers({
    options: function () {
        // font size = null (default), bg
        // paper = a4, a5, mini
        // orientation = portrait, landscape
        return {
            //fontSize: 'bg',
            paper: 'a4',
            orientation: 'portrait'
        };
    },
    dataMain: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        /*Fetcher.setDefault('data',false);
         Fetcher.retrieve('data','acc_BalanceSheet',q);

         return Fetcher.get('data');*/


        var callId = JSON.stringify(q);

        var call = Meteor.callAsync(callId, 'acc_BalanceSheet', q);

        if (!call.ready()) {
            return false;
        }
        return call.result();
    }
});

var switcherFun = function () {
    var elem = document.querySelector('.js-switch');
    var init = new Switchery(elem, {
        color: '#3c8dbc',
        size: 'small'
    });
};






