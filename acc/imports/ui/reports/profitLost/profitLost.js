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
// import '../../../../common/methods/reports/profitLost';
import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {ProfitLostReport} from '../../../../imports/api/collections/reports/profitLost';

// Page
import './profitLost.html';
// Declare template

var reportTpl = Template.acc_ProfitLostReport,
    generateTpl = Template.acc_ProfitLostReportGen,
    generateTplForAll = Template.acc_ProfitLostForAllReportGen,
    tmplPrintData = Template.acc_ProfitLostReportPrintData,
    tmplPrintDataForAll= Template.acc_ProfitLostForAllPrintData;

reportTpl.onRendered(function () {
    switcherFun();
})

reportTpl.helpers({
    schema() {
        return ProfitLostReport;
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
    createNewAlertify('acc_profitLost');
    this.autorun(() => {
        // Check form data
        if (formDataState.get()) {
            rptInitState.set(true);
            rptDataState.set(null);


            rptInitStateForAllCurrency.set(false);
            rptDataStateForAllCurrency.set(null);
            let params = formDataState.get();

            Meteor.call('acc_profitLost', params, function (err, result) {
                if (result) {
                    rptDataState.set(result);
                } else {
                    console.log(err.message);
                }
            })


        }

        // Check form data
        if (formDataStateForAllCurency.get()) {
            createNewAlertify('acc_profitLostForAll');

            rptInitStateForAllCurrency.set(true);
            rptDataStateForAllCurrency.set(null);

            rptInitState.set(false);
            rptDataState.set(null);
            let params = formDataStateForAllCurency.get();

            Meteor.call('acc_profitLostForAll', params, function (err, result) {
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
        let dateRange=$("[name='date']").val();

        pa.branchId=$("[name='branchId']").val();
        pa.currencyId=$("[name='currencyId']").val();
        pa.exchangeDate=$("[name='exchangeDate']").val();
        pa.dateRange=dateRange;

        pa.chartAccount=self.account;
        pa.accountType=['40','41','50','51','60'];

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
        let dateRange=$("[name='date']").val();


        pa.branchId=$("[name='branchId']").val();
        pa.currencyId=$("[name='currencyId']").val();
        pa.exchangeDate=$("[name='exchangeDate']").val();
        pa.dateRange=dateRange;

        pa.chartAccount=self.account;
        pa.accountType=['40','41','50','51','60'];

        var path='/acc/transactionDetailReport?branchId='+pa.branchId+'&accountType='+
            pa.accountType+'&chartAccount='+pa.chartAccount
            +'&date='+pa.dateRange+'&exchangeDate='+pa.exchangeDate
            +'&currencyId='+pa.currencyId;

        window.open(path,'_blank');

    }
});




reportTpl.events({
    'click .run ': function (e,t) {

        let result={};
        result.branchId= $('[name="branchId"]').val();
        result.date= $('[name="date"]').val();
        result.currencyId= $('[name="currencyId"]').val();
        result.exchangeDate= $('[name="exchangeDate"]').val();
        result.showNonActive = $('[name="showNonActive"]').is(":checked");

        if(result.exchangeDate==""){
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
            alertify.acc_profitLostForAll(fa('', ''), renderTemplate(tmplPrintDataForAll)).maximize();
        }else {
            alertify.acc_profitLost(fa('', ''), renderTemplate(tmplPrintData)).maximize();
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
generateTplForAll.events({
    'dblclick .profitRow': function (e, t) {
            var params={};
            var queryParams={};

         var q = FlowRouter.current().queryParams;
         var self=this;

        queryParams.branchId=q.branchId;
        queryParams.currencyId=q.currencyId;
        queryParams.date=q.date;

        var code=  replaceAll(self.code,"&nbsp;","");

         var account=Acc.Collection.ChartAccount.findOne({code: code});
        var accountTypeId=[];
        accountTypeId.push(account.accountTypeId);

        queryParams.chartAccount=account._id;
        queryParams.accountType=accountTypeId;

        var path = FlowRouter.path("acc.journalReportGen", params, queryParams);

        window.open(path,"_blank");

    }
});

generateTpl.events({
    'dblclick .profitRow': function (e, t) {
            var params={};
            var queryParams={};

         var q = FlowRouter.current().queryParams;
         var self=this;

        queryParams.branchId=q.branchId;
        queryParams.currencyId=q.currencyId;
        queryParams.date=q.date;

        var code=  replaceAll(self.code,"&nbsp;","");

         var account=Acc.Collection.ChartAccount.findOne({code: code});
        var accountTypeId=[];
        accountTypeId.push(account.accountTypeId);

        queryParams.chartAccount=account._id;
        queryParams.accountType=accountTypeId;

        var path = FlowRouter.path("acc.journalReportGen", params, queryParams);

        window.open(path,"_blank");

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
    }
    ,data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

       /* var tmp='acc_profitLost';
        if(q.currencyId="All"){
            tmp='acc_profitLostForAll';
        }*/

        Fetcher.setDefault('data',false);
        Fetcher.retrieve('data','acc_profitLost',q);

        return Fetcher.get('data');

       /* var callId = JSON.stringify(q);
        var call = Meteor.callAsync(callId,'acc_profitLost', q);

        if (!call.ready()) {
            return false;
        }
        return call.result();*/
    }
});


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
    }
    ,data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;

        var callId = JSON.stringify(q);
        var call = Meteor.callAsync(callId, 'acc_profitLostForAll', q);

        if (!call.ready()) {
            return false;
        }
        return call.result();
    }
});

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

var   switcherFun = function () {
    var elem = document.querySelector('.js-switch');
    var init = new Switchery(elem, {
        color: '#3c8dbc',
        size: 'small'
    });
};





