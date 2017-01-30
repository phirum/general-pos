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

// Method
// import '../../../../common/methods/reports/profitLost';
import '../../libs/getBranch';
import '../../libs/format';
// Schema
import {CashFlowReport} from '../../../../imports/api/collections/reports/cashFlow';

// Page
import './cashFlow.html';
// Declare template

var reportTpl = Template.acc_cashFlowReport,
    generateTpl = Template.acc_cashFlowReportGen;

reportTpl.onRendered(function () {
    switcherFun();
})

reportTpl.helpers({
    schema() {
        return CashFlowReport;
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
            orientation: 'landscape'
            /*orientation: 'portrait'*/
        };
    }
    ,data: function () {
        // Get query params
        //FlowRouter.watchPathChange();
        var q = FlowRouter.current().queryParams;


        Fetcher.setDefault('data',false);
        Fetcher.retrieve('data','acc_cashFlow',q);

        return Fetcher.get('data');
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





