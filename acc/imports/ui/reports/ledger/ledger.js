import {Meteor} from 'meteor/meteor';
import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {AutoForm} from 'meteor/aldeed:autoform';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import 'meteor/theara:autoprint';
import {DateTimePicker} from 'meteor/tsega:bootstrap3-datetimepicker';
import {alertify} from 'meteor/ovcharik:alertifyjs';


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


//Collection
import {Currency} from '../../../api/collections/currency';
import {ChartAccount} from '../../../api/collections/chartAccount';
// Method
// import '../../../../common/methods/reports/ledger';
import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {LedgerReport} from '../../../../imports/api/collections/reports/ledger';

// Page
import './ledger.html';
// Declare template

var reportTpl = Template.acc_ledgerReport,
    generateTpl = Template.acc_ledgerReportGen,
    ledgerTpl = Template.acc_ledgerReportGen,
    ledgerShow = Template.acc_LedgerShow,
    tmplPrintData = Template.acc_ledgerReportPrintData;


reportTpl.helpers({
    schema() {
        return LedgerReport;
    }
})

//===================================Run

// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);


reportTpl.onCreated(function () {
    createNewAlertify(['acc_ledgerReport',"showJournal"]);
    this.autorun(() => {

        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            Meteor.call('acc_ledgerReport', params, function (err, result) {
                if (result) {
                    rptDataState.set(result);
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
        }
    },
    rptData: function () {
        return rptDataState.get();
    }
});


reportTpl.events({
    'click .run ': function (e, t) {

        let result = {};
        result.branchId = $('[name="branchId"]').val();
        result.date = $('[name="date"]').val();
        result.currencyId = $('[name="currencyId"]').val();
        result.exchangeDate = $('[name="exchangeDate"]').val();
        result.accountType = $('[name="accountType"]').val();
        result.chartAccount = $('[name="chartAccount"]').val();

        if (result.accountType == "" || result.exchangeDate == "") {
            alertify.warning("Required!!!");
            return false;
        }


        formDataState.set(result);
    },
    'change [name="accountType"]': function (e) {
        Session.set('accountTypeIdSession', $(e.currentTarget).val());
    },
    'click .fullScreen'(event, instance){

        alertify.acc_ledgerReport(fa('', ''), renderTemplate(tmplPrintData)).maximize();
    },
    'click .btn-print'(event, instance){

        $('#print-data').printThis();
    }
});


reportTpl.onDestroyed(function () {
    formDataState.set(null);
    rptDataState.set(null);
    rptInitState.set(false);
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
tmplPrintData.events({
    'click .split-account-detail': function (e, t) {
        var self = this;
        /*var tr = $(e.currentTarget).closest("tr");
         var voucher= tr.find('.voucher-id').text().trim();*/
        // var data = Acc.Collection.Journal.findOne({voucherId: self.voucherId,_id: self._id});

        Meteor.call('getJournalForLedger', self._id, function (err, data) {
            alertify.showJournal(fa("eye", "Journal"), renderTemplate(ledgerShow, data));
        })
    }
});

// ===============================Generate


reportTpl.events({
    'change [name="accountType"]': function (e) {
        Session.set('accountTypeIdSession', $(e.currentTarget).val());
    }
});

ledgerTpl.onRendered(function () {
    // Create new  alertify
    createNewAlertify("showJournal");
});
//Event
ledgerTpl.events({
    'click .split-account-detail': function (e, t) {
        var self = this;
        /*var tr = $(e.currentTarget).closest("tr");
         var voucher= tr.find('.voucher-id').text().trim();*/
        // var data = Acc.Collection.Journal.findOne({voucherId: self.voucherId,_id: self._id});

        Meteor.call('getJournalForLedger', self._id, function (err, data) {
            alertify.showJournal(fa("eye", "Journal"), renderTemplate(ledgerShow, data));
        })
    }
});


//Helper
ledgerShow.helpers({
    formatMoney: function (val) {
        return numeral(val).format('0,0.00');
    },
    getCurrency: function (id) {
        let currency = Currency.findOne({_id: id});
        if (currency) {
            return currency.symbol;
        }
    },
    getChartAccount: function (id) {
        let account = ChartAccount.findOne({_id: id});
        if (account) {
            return account.name;
        }
    }
})


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
    data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        Fetcher.setDefault('data', false);
        Fetcher.retrieve('data', 'acc_ledgerReport', q);

        return Fetcher.get('data');
        /* var callId = JSON.stringify(q);

         var call = Meteor.callAsync(callId, 'acc_ledgerReport', q);

         if (!call.ready()) {
         return false;
         }
         return call.result();*/
    }
});


/*AutoForm.hooks({
 // Customer
 acc_LedgerReport: {
 onSubmit: function (doc) {
 /!*
 doc.accountType=doc.accountType.join(",");
 return doc;*!/
 doc.date=doc.date.replace(' ','+');
 doc.date=doc.date.replace(' ','+');
 var path='/acc/ledgerReportGen?branchId='+doc.branchId+'&accountType='+
 doc.accountType+'&chartAccount='+doc.chartAccount
 +'&date='+doc.date+'&exchangeDate='+doc.exchangeDate
 +'&currencyId='+doc.currencyId;
 window.open(path,'_blank');
 return false;
 }
 }
 });*/






