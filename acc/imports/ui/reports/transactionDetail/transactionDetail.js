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
import '../../libs/getBranch';
import '../../libs/format';

//Collection
import {Currency} from '../../../api/collections/currency';
import {ChartAccount} from '../../../api/collections/chartAccount';

// Schema
import {TransactionDetailReport} from '../../../../imports/api/collections/reports/transactionDetail';

// Page
import './transactionDetail.html';
import '../../pages/journal/journal.js';

// Declare template

var reportTpl = Template.acc_transactionDetailReport,
    generateTpl = Template.acc_transactionDetailReportGen,
    updateTpl = Template.acc_journalUpdate,
    tmplPrintData = Template.acc_transactionDetailReportPrintData;




//===================================Run

// Form state
let formDataState = new ReactiveVar(null);


// Index
let rptInitState = new ReactiveVar(false);
let rptDataState = new ReactiveVar(null);



reportTpl.helpers({
    schema() {
        return TransactionDetailReport;
    },
    param(){
        let param = FlowRouter.current().query;

        Session.set('accountTypeIdSession', param.accountType);
        if (!(param.accountType instanceof Array)) {

            Session.set('accountTypeIdSession', param.accountType.split(','));
            param.accountType =param.accountType.split(',');

        } else {
            Session.set('accountTypeIdSession', param.accountType);
        }

        formDataState.set(param);
        return param;
    }
})

reportTpl.onCreated(function () {
    createNewAlertify(['acc_transactionDetail', 'journal']);
    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);

            let params = formDataState.get();

            Meteor.call('acc_transactionDetailReport', params, function (err, result) {
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

tmplPrintData.events({
    'dblclick .journalRow': function (e, t) {

        var self = this;

        var selectorGetLastDate = {};
        var branchId = Session.get("currentBranch");
        selectorGetLastDate.branchId = branchId;

        var selector = {};
        selector._id = self._id;


        Meteor.call('getDateEndOfProcess', selectorGetLastDate, function (err, lastDate) {
            Meteor.call('getJournal', selector, function (err, data) {
                if ((data && (data.endId == "0" || data.endId == undefined) ) && ((data.fixAssetExpenseId == "0" || data.fixAssetExpenseId == undefined) && (data.closingId == "0" || data.closingId == undefined ) && data.refId == undefined)) {
                    if (data.voucherId.length > 10) {
                        data.voucherId = data.voucherId.substr(8, 6);
                    }
                    Session.set('dobSelect', data.journalDate);
                    Session.set('currencyId', data.currencyId);

                    if (data.transactionAsset != undefined) {
                        if (data.transactionAsset.length > 0) {
                            stateFixAsset.set('isFixAsset', true);
                            $('.js-switch').trigger("click");
                        }
                    }

                    if (lastDate != null) {
                        if (lastDate.closeDate < data.journalDate) {
                            alertify.journal(fa("plus", "Journal"), renderTemplate(updateTpl, data)).maximize();
                        } else {
                            alertify.error("Can not update, you already end of process!!!");
                        }
                    } else {
                        alertify.journal(fa("plus", "Journal"), renderTemplate(updateTpl, data)).maximize();
                    }
                } else {
                    alertify.warning("Can't Update!!!");
                }
            });
        });
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
        debugger;
        Session.set('accountTypeIdSession', $(e.currentTarget).val());
    },
    'click .fullScreen'(event, instance){
        alertify.acc_transactionDetail(fa('', ''), renderTemplate(tmplPrintData)).maximize();
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


generateTpl.onCreated(function () {
    createNewAlertify(['journal']);
})

//Event
generateTpl.events({
    'dblclick .journalRow': function (e, t) {
        var self = this;

        var selectorGetLastDate = {};
        var branchId = Session.get("currentBranch");
        selectorGetLastDate.branchId = branchId;

        var selector = {};
        selector._id = self._id;


        Meteor.call('getDateEndOfProcess', selectorGetLastDate, function (err, lastDate) {
            Meteor.call('getJournal', selector, function (err, data) {
                if ((data && (data.endId == "0" || data.endId == undefined) ) && ((data.fixAssetExpenseId == "0" || data.fixAssetExpenseId == undefined) && (data.closingId == "0" || data.closingId == undefined ) && data.refId == undefined)) {


                    if (data.voucherId.length > 10) {
                        data.voucherId = data.voucherId.substr(8, 6);
                    }
                    Session.set('dobSelect', data.journalDate);
                    Session.set('currencyId', data.currencyId);

                    if (data.transactionAsset != undefined) {
                        if (data.transactionAsset.length > 0) {
                            stateFixAsset.set('isFixAsset', true);
                            $('.js-switch').trigger("click");
                        }
                    }

                    if (lastDate != null) {
                        if (lastDate.closeDate < data.journalDate) {
                            alertify.journal(fa("plus", "Journal"), renderTemplate(Template.acc_journalUpdate, data)).maximize();
                        } else {
                            alertify.error("Can not update, you already end of process!!!");
                        }
                    } else {
                        alertify.journal(fa("plus", "Journal"), renderTemplate(Template.acc_journalUpdate, data)).maximize();
                    }
                } else {
                    alertify.warning("Can't Update!!!");
                }
            });
        });
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
    data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        Fetcher.setDefault('data', false);
        Fetcher.retrieve('data', 'acc_transactionDetailReport', q);

        return Fetcher.get('data');
        /* var callId = JSON.stringify(q);

         var call = Meteor.callAsync(callId, 'acc_ledgerReport', q);

         if (!call.ready()) {
         return false;
         }
         return call.result();*/
    }
});