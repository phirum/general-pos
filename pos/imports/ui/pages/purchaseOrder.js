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
import {PurchaseOrder} from '../../api/collections/purchaseOrder.js';

// Tabular
import {PurchaseOrderTabular} from '../../../common/tabulars/purchaseOrder.js';

// Page
import './purchaseOrder.html';
import './purchaseOrder-items.js';
import './info-tab.html';
//methods
import {PurchaseOrderInfo} from '../../../common/methods/purchase-order.js'
import {vendorInfo} from '../../../common/methods/vendor.js';
//Tracker for vendor infomation
Tracker.autorun(function(){
  if(Session.get('vendorId')){
    vendorInfo.callPromise({_id: Session.get('vendorId')})
        .then(function(result){
          Session.set('vendorInfo', result);
        })
  }
});
// Declare template
let indexTmpl = Template.Pos_purchaseOrder,
    actionTmpl = Template.Pos_purchaseOrderAction,
    newTmpl = Template.Pos_purchaseOrderNew,
    editTmpl = Template.Pos_purchaseOrderEdit,
    showTmpl = Template.Pos_purchaseOrderShow;

// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
indexTmpl.onCreated(function () {
  // Create new  alertify
  createNewAlertify('purchaseOrder', {size: 'lg'});
  createNewAlertify('purchaseOrderShow',);
});

indexTmpl.helpers({
  tabularTable(){
    return PurchaseOrderTabular;
  },
  selector() {
    return {branchId: Session.get('currentBranch')};
  }
});

indexTmpl.events({
  'click .js-create' (event, instance) {
    alertify.purchaseOrder(fa('plus', TAPi18n.__('pos.purchaseOrder.title')), renderTemplate(newTmpl)).maximize();
  },
  'click .js-update' (event, instance) {
    alertify.purchaseOrder(fa('pencil', TAPi18n.__('pos.purchaseOrder.title')), renderTemplate(editTmpl, this));
  },
  'click .js-destroy' (event, instance) {
    let data = this;
    destroyAction(
        PurchaseOrder,
        {_id: data._id},
        {title: TAPi18n.__('pos.purchaseOrder.title'), itemTitle: data._id}
    );
  },
  'click .js-display' (event, instance) {
    alertify.purchaseOrderShow(fa('eye', TAPi18n.__('pos.purchaseOrder.title')), renderTemplate(showTmpl, this));
  },
  'click .js-invoice' (event, instance) {
    let params = {};
    let queryParams = {purchaseOrderId: this._id};
    let path = FlowRouter.path("pos.purchaseOrderReportGen", params, queryParams);

    window.open(path, '_blank');
  }
});

// New
newTmpl.events({
  'change [name=vendorId]'(event, instance){
    if(event.currentTarget.value != ''){
      Session.set('vendorId', event.currentTarget.value);
    }
  }
});
newTmpl.helpers({
  vendorInfo() {
    let vendorInfo = Session.get('vendorInfo');
    if(!vendorInfo){
      return {empty: true, message: 'No data available'}
    }

    return {
      fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale PurchaseOrder to be invoice: <span class="label label-primary">0</span>`
    };
  },
  collection(){
    return PurchaseOrder;
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
  Session.set('vendorId', undefined);
});

// Edit
editTmpl.onCreated(function () {
  this.autorun(()=> {
    this.subscribe('pos.purchaseOrder', {_id: this.data._id});
  });
});

editTmpl.helpers({
  collection(){
    return PurchaseOrder;
  },
  data () {
    let data = PurchaseOrder.findOne(this._id);

    // Add items to local collection
    _.forEach(data.items, (value)=> {
      Meteor.call('getItem', value.itemId, function(err, result){
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
showTmpl.onCreated(function () {
  this.purchaseOrder = new ReactiveVar();
  this.autorun(()=> {
    PurchaseOrderInfo.callPromise({_id: this.data._id})
        .then( (result) => {
          this.purchaseOrder.set(result);
        }).catch(function (err) {
          console.log(err.message);
        }
    );
  });
});

showTmpl.helpers({
  i18nLabel(label){
    let key = `pos.purchaseOrder.schema.${label}.label`;
    return TAPi18n.__(key);
  },
  PurchaseOrderInfo () {

    let purchaseOrderInfo = Template.instance().purchaseOrder.get();

    // Use jsonview
    purchaseOrderInfo.jsonViewOpts = {collapsed: true};
    //
    return purchaseOrderInfo;
  }
});

// Hook
let hooksObject = {
  before: {
    insert: function (doc) {
      let items = [];
      itemsCollection.find().forEach((obj)=> {
        delete obj._id;
        items.push(obj);
      });
      doc.items = items;

      return doc;
    },
    update: function (doc) {
      let items = [];
      itemsCollection.find().forEach((obj)=> {
        delete obj._id;
        items.push(obj);
      });
      doc.$set.items = items;

      delete doc.$unset;

      return doc;
    }
  },
  onSuccess (formType, result) {
    // if (formType == 'update') {
    // Remove items collection
    itemsCollection.remove({});

    alertify.purchaseOrder().close();
    // }
    displaySuccess();
  },
  onError (formType, error) {
    displayError(error.message);
  }
};

AutoForm.addHooks([
  'Pos_purchaseOrderNew',
  'Pos_purchaseOrderEdit'
], hooksObject);
