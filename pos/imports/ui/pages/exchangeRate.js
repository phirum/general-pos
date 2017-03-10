import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';
import {Setting} from '../../../../core/imports/api/collections/setting.js';
import {Currency} from '../../../../core/imports/api/collections/currency.js'

// Collection
import {ExchangeRates} from '../../api/collections/exchangeRate.js';
import {balanceTmpCollection} from '../../api/collections/tmpCollection';
// Tabular
import {ExchangeRateTabular} from '../../../common/tabulars/exchangeRate.js';

// Page
import './exchangeRate.html';

// Declare template
let indexTmpl = Template.Pos_exchangeRate,
    actionTmpl = Template.Pos_exchangeRateAction,
    newTmpl = Template.Pos_exchangeRateNew,
    editTmpl = Template.Pos_exchangeRateEdit,
    showTmpl = Template.Pos_exchangeRateShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('exchangeRate', {size: 'lg'});
    createNewAlertify('exchangeRateShow');

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('pos.exchangeRateByBranchFilter', ['branchId']);
    this.autorun(() => {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.onDestroyed(() => {
    ReactiveTable.clearFilters(['pos.exchangeRateByBranchFilter']);
    balanceTmpCollection.remove({});
});

indexTmpl.helpers({
    tabularTable(){
        return ExchangeRateTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    },
    tableSettings(){
        let i18nPrefix = 'pos.exchangeRate.schema';

        reactiveTableSettings.collection = 'pos.reactiveTable.exchangeRate';
        reactiveTableSettings.filters = ['pos.exchangeRateByBranchFilter'];
        reactiveTableSettings.fields = [
            // {
            //     key: '_id',
            //     label: __(`${i18nPrefix}._id.label`),
            //     sortOrder: 0,
            //     sortDirection: 'asc'
            // },
            {key: 'name', label: __(`${i18nPrefix}.name.label`)},
            {key: 'gender', label: __(`${i18nPrefix}.gender.label`)},
            {key: 'telephone', label: __(`${i18nPrefix}.telephone.label`)},
            {key: '_term.name', label: __(`${i18nPrefix}.term.label`)},
            {key: '_paymentGroup.name', label: __(`${i18nPrefix}.paymentGroup.label`)},
            {
                key: '_id',
                label(){
                    return ''
                },
                headerClass: function () {
                    let css = 'col-receive-payment cursor-pointer';
                    return css;
                }
            },
            {
                key: '_id',
                label(){
                    return fa('bars', '', true);
                },
                headerClass: function () {
                    let css = 'text-center col-action';
                    return css;
                },
                tmpl: actionTmpl, sortable: false
            }
        ];

        return reactiveTableSettings;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.exchangeRate(fa('plus', TAPi18n.__('pos.exchangeRate.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.exchangeRate(fa('pencil', TAPi18n.__('pos.exchangeRate.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isExchangeRateHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        ExchangeRates,
                        {_id: id},
                        {title: TAPi18n.__('pos.exchangeRate.title'), itemTitle: id}
                    );
                }
            }
        });

    },
    'click .js-display' (event, instance) {
        alertify.exchangeRateShow(fa('eye', TAPi18n.__('pos.exchangeRate.title')), renderTemplate(showTmpl, this));
    },
    'click .go-to-receive-payment'(event, instance){
        FlowRouter.go('pos.receivePayment', {exchangeRateId: this._id});
    }
});

newTmpl.onCreated(function () {
    this.paymentType = new ReactiveVar();
});

// New
newTmpl.helpers({
    collection(){
        return ExchangeRates;
    },
    isTerm(){
        return Template.instance().paymentType.get() == "Term";
    },
    isGroup(){
        return Template.instance().paymentType.get() == "Group";
    },
    baseCurrency(){
        debugger;
        let setting = Setting.findOne();
        return Currency.findOne(setting.baseCurrency);
    },
    otherCurrencies(){
        let setting = Setting.findOne();
        return Currency.find({_id: {$ne: setting.baseCurrency}});
    }
});
newTmpl.events({
    'change [name="paymentType"]'(event, instance){
        instance.paymentType.set($(event.currentTarget).val());
    }
});


// Edit
editTmpl.onCreated(function () {
    this.paymentType = new ReactiveVar(this.data.paymentType);
    this.autorun(() => {
        this.subscribe('pos.exchangeRate', {_id: this.data._id});
    });
});
editTmpl.events({
    'change [name="paymentType"]'(event, instance){
        instance.paymentType.set($(event.currentTarget).val());
    }
});

editTmpl.helpers({
    collection(){
        return ExchangeRates;
    },
    data () {
        let data = ExchangeRates.findOne(this._id);
        return data;
    },
    isTerm(){
        return Template.instance().paymentType.get() == "Term";
    },
    isGroup(){
        return Template.instance().paymentType.get() == "Group";
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(() => {
        this.subscribe('pos.exchangeRate', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.exchangeRate.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = ExchangeRates.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            debugger;
            let rates = [];
            $('.rates tr').each(function () {
                let currency = $(this).find('.currency').text().trim();
                let rate = parseFloat($(this).find('.rate').val());
                let symbol = $(this).find('.symbol').text().trim();
                rates.push({currency: currency, rate: rate, symbol: symbol});
            });
            doc.rates = rates;
            return doc;
        },
        update: function (doc) {
            let rates = [];
            $('.rates tr').each(function () {
                let currency = $(this).find('.currency').text().trim();
                let rate = parseFloat($(this).find('.rate').val());
                let symbol = $(this).find('.symbol').text().trim();
                rates.push({currency: currency, rate: rate, symbol: symbol});
            });
            doc.$set.rates = rates;
            return doc;
        }
    },
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.exchangeRate().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_exchangeRateNew',
    'Pos_exchangeRateEdit'
], hooksObject);
