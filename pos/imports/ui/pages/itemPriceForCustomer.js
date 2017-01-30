import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {Template} from 'meteor/templating';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';

//import tabular
import  {ItemPriceForCustomerTabular} from '../../../common/tabulars/itemPriceForCustomer';

import {ItemPriceForCustomers, ItemPriceForCustomersDetail} from '../../api/collections/itemPriceForCustomer.js';
import {tmpCollection} from '../../api/collections/tmpCollection.js';
import './itemPriceForCustomer.html';
let indexTmpl = Template.Pos_itemPriceForCustomer,
    insertTmpl = Template.Pos_itemPriceForCustomerNew,
    actionTmpl = Template.Pos_itemPriceForCustomerAction,
    editTmpl = Template.Pos_itemPriceForCustomerEdit,
    showTmpl = Template.Pos_itemPriceForCustomerShow,
    itemDetailTmpl = Template.itemPriceForCustomerDetail;
// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('itemPriceForCustomer', {size: 'lg'});
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.itemPriceForCustomer(fa('plus', 'Add New'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
    tabularTable(){
        return ItemPriceForCustomerTabular;
    }
});

//insert
insertTmpl.helpers({
    collection(){
        return ItemPriceForCustomers;
    }
});
itemDetailTmpl.helpers({
    schemaDetail(){
        return ItemPriceForCustomersDetail;
    },
    tmpCollections(){
        return tmpCollection.find();
    }
});
itemDetailTmpl.events({
    'click .add'(event, instance){
        let itemId = instance.itemId;
        let price = $('[name="price"]').val();
        let name = instance.name;
        let existItem = tmpCollection.findOne({itemId: itemId});
        if (existItem) {
            alertify.warning('មុខទំនិញបានបញ្ចូលរួចហើយ!');
        } else {
            tmpCollection.insert({itemId: itemId, price: price == '' ? 0 : parseFloat(price), name: name});
        }
    },
    'change [name="itemId"]'(event, instance){
        instance.itemId = event.currentTarget.value;
        instance.name = event.currentTarget.selectedOptions[0].text;
    },
    'change .price'(event, instance){
        if (event.currentTarget.value == '' || event.currentTarget.value == '0') {
            $(event.currentTarget).val(this.price);
        } else {
            tmpCollection.update({itemId: this.itemId}, {$set: {price: parseFloat(event.currentTarget.value)}}, function (err, result) {
                if (result) {
                    alertify.success('Item updated!');
                } else {
                    alertify.error(err.message);
                }
            });

        }
    },
    "keypress .price" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ($(evt.currentTarget).val().indexOf('.') != -1) {
            if (charCode == 46) {
                return false;
            }
        }
        return !(charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57));
    },
    'click .remove'(event, instance){
        tmpCollection.remove({itemId: this.itemId}, function (err, result) {
            if (err) {
                alertify.error(err.message);
            } else {
                alertify.success('Item removed!');
            }
        })
    }
});
itemDetailTmpl.onDestroyed(function () {
    tmpCollection.remove({});
});
//update
editTmpl.onCreated(function () {
    this.data.items.forEach(function (item) {
        Meteor.call('findItemName', item.itemId, function (err, result) {
            item.name = result.name;
            tmpCollection.insert(item);
        })
    });
});
editTmpl.onDestroyed(function () {
    tmpCollection.remove({});
});
editTmpl.helpers({
    collection(){
        return ItemPriceForCustomers;
    }
});
// actionTmpl
actionTmpl.events({
    'click .js-update'(event, instance){
        let data = this;
        alertify.itemPriceForCustomer(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, data));
    },
    'click .js-display'(event, instance){
        alertify.itemPriceForCustomer(fa('pencil', 'Display'), renderTemplate(showTmpl, this));

    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            ItemPriceForCustomers,
            {_id: this._id},
            {title: 'Remove Unit', itemTitle: this._id}
        );
    }
});

let hooksObject = {
    before: {
        insert(doc){
            doc.items = tmpCollection.find({}).fetch();
            return doc;
        },
        update(doc){
            doc.$set.items = tmpCollection.find({}).fetch();
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.itemPriceForCustomer().close();
        }
        tmpCollection.remove({});
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_itemPriceForCustomerNew',
    'Pos_itemPriceForCustomerEdit'
], hooksObject)
