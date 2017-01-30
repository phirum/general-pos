import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import 'meteor/theara:jsonview';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';


// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {ExchangeGratis} from '../../api/collections/exchangeGratis.js';

// Tabular
import {ExchangeGratisTabular} from '../../../common/tabulars/exchangeGratis.js';

// Page
import './exchangeGratis.html';
import './exchangeGratis-items.js';
import './info-tab.html';
//methods
import {ExchangeGratisInfo} from '../../../common/methods/exchangeGratis.js'
import {vendorInfo} from '../../../common/methods/vendor.js';
import {isBillExist} from '../../../common/methods/exchangeGratis';
//Tracker for vendor infomation
Tracker.autorun(function () {
    if (Session.get("exchangeGratisVendorId")) {
        vendorInfo.callPromise({_id: Session.get("exchangeGratisVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
});
// Declare template
let indexTmpl = Template.Pos_exchangeGratis,
    actionTmpl = Template.Pos_exchangeGratisAction,
    newTmpl = Template.Pos_exchangeGratisNew,
    editTmpl = Template.Pos_exchangeGratisEdit,
    showTmpl = Template.Pos_exchangeGratisShow;

// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('exchangeGratis', {size: 'lg'});
    createNewAlertify('exchangeGratisShow', {size: 'lg'});
});

indexTmpl.helpers({
    tabularTable(){
        return ExchangeGratisTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.exchangeGratis(fa('plus', TAPi18n.__('pos.exchangeGratis.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        var data = this;
        Meteor.call('isExchangeGratisHasRelation', data._id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    swal('បញ្ជាក់!', `សូមធ្វើការលុប Receive Item លេខ​ ${result} ជាមុនសិន!​​​​`, 'error');
                } else {
                    alertify.exchangeGratis(fa('pencil', TAPi18n.__('pos.exchangeGratis.title')), renderTemplate(editTmpl, data));
                }
            }
        });
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isExchangeGratisHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    swal('បញ្ជាក់!', `សូមធ្វើការលុប Receive Item លេខ​ ${result} ជាមុនសិន!​​​​`, 'error');
                } else {
                    destroyAction(
                        ExchangeGratis,
                        {_id: id},
                        {title: TAPi18n.__('pos.exchangeGratis.title'), itemTitle: id}
                    );
                }
            }
        });
    },
    'click .js-display' (event, instance) {
        swal({
            title: 'Please Wait',
            text: 'Getting Gratis...',
            showConfirmButton: false
        });
        Meteor.call('exchangeGratisShowItem', {_id: this._id}, function (err, result) {
            setTimeout(function () {
                swal.close();
            }, 1000);
            alertify.exchangeGratisShow(fa('eye', TAPi18n.__('pos.exchangeGratis.title')), renderTemplate(showTmpl, result));
        });
    },
    'click .js-invoice' (event, instance) {
        let params = {};
        let queryParams = {exchangeGratisId: this._id};
        let path = FlowRouter.path("pos.exchangeGratisReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.events({
    'change [name=vendorId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('exchangeGratisVendorId', event.currentTarget.value);
        }
    }
})
newTmpl.helpers({
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale ExchangeGratis to be invoice: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return ExchangeGratis;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('exchangeGratisVendorId', undefined);
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.exchangeGratis', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return ExchangeGratis;
    },
    data () {
        let data = ExchangeGratis.findOne(this._id);

        // Add items to local collection
        _.forEach(data.items, (value)=> {
            Meteor.call('getItem', value.itemId, function (err, result) {
                value.name = result.name;
                itemsCollection.insert(value);
            })
        });

        return data;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
});

// Show
showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.exchangeGratis.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    colorizeType(type) {
        if (type == 'term') {
            return `<label class="label label-info">T</label>`
        }
        return `<label class="label label-success">G</label>`
    },
    colorizeStatus(status){
        if(status == 'active') {
            return `<label class="label label-info">A</label>`
        }else if(status == 'partial') {
            return `<label class="label label-danger">P</label>`
        }
        return `<label class="label label-success">C</label>`
    }
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            let sumRemainQty = 0;
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty;
                sumRemainQty += obj.qty;
                items.push(obj);
            });
            doc.sumRemainQty = sumRemainQty;
            doc.items = items;
            doc.status = 'active';
            return doc;
        },
        update: function (doc) {
            let items = [];
            let sumRemainQty = 0;
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty;
                sumRemainQty += obj.qty;
                items.push(obj);
            });
            doc.$set.sumRemainQty = sumRemainQty;
            doc.$set.items = items;
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, result) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});

        alertify.exchangeGratis().close();
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_exchangeGratisNew',
    'Pos_exchangeGratisEdit'
], hooksObject);
