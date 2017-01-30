import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveVar} from 'meteor/reactive-var'
import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
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

//methods
import {getUnitName} from '../../../common/methods/item-info.js';
import {itemInfo} from '../../../common/methods/item-info';
// Collection
import {Item} from '../../api/collections/item.js';


import {Units} from '../../api/collections/units.js'
//localCollection
import {tmpCollection} from '../../api/collections/tmpCollection.js';

//schema
import {ItemsSchema} from '../../api/collections/order-items.js'
// Tabular
import {ItemTabular} from '../../../common/tabulars/item.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';

// Page
import './item.html';
import './unit.js'
import '../../../../acc/imports/ui/pages/chartAccount/chartAccount';
// Declare template
let indexTmpl = Template.Pos_item,
    actionTmpl = Template.Pos_itemAction,
    newTmpl = Template.Pos_itemNew,
    editTmpl = Template.Pos_itemEdit,
    showTmpl = Template.Pos_itemShow,
    newChartAccount = Template.acc_chartAccountInsert;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('item', {size: 'lg'});
    createNewAlertify('addOn');
    createNewAlertify('tmpItem');
    createNewAlertify('addNewChartAccount');
});

indexTmpl.helpers({
    tabularTable(){
        return ItemTabular;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.item(fa('plus', TAPi18n.__('pos.item.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.item.title')), renderTemplate(editTmpl, this)).maximize();
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isItemHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        Item,
                        {_id: id},
                        {title: TAPi18n.__('pos.item.title'), itemTitle: id}
                    );
                }
            }
        });

    },
    'click .js-display' (event, instance) {
        alertify.item(fa('eye', TAPi18n.__('pos.item.title')), renderTemplate(showTmpl, this));
    },
});

// New
newTmpl.onCreated(function () {
    this.categoryList = new ReactiveVar();
    //let categoryId = Session.get('CategoryIdSession');
    Meteor.call('categoryList', 'Select One | No Parent', null, (err, result) => {
        this.categoryList.set(result);
    });
});

newTmpl.helpers({
    collection(){
        return Item;
    },
    categoryList(){
        //let categoryId = Session.get('CategoryIdSession');
        //return ReactiveMethod.call('categoryList', 'Select One | No Parent',categoryId);
        let list = [];
        let categories = Template.instance().categoryList.get();
        categories.forEach(function (category) {
            list.push({
                label: Spacebars.SafeString(category.label),
                value: category.value
            });
        });
        return list;
    }
});
newTmpl.onDestroyed(() => {
    tmpCollection.remove({});
});
newTmpl.events({
    'click [name="unitId"]'(event, instance){
        alertify.addOn(fa('plus', 'Add Unit'), renderTemplate(Template.Pos_unitNew));
    },
    'change .toggle-scheme'(event, instance){
        tmpCollection.remove({});
        if ($(event.currentTarget).prop('checked')) {
            $('.scheme').removeClass('hidden');
            $('.price-div').addClass('hidden');
            $('[name="price"]').val(0);
            $('[name="purchasePrice"]').val(0);
        } else {
            $('.scheme').addClass('hidden');
            $('.price-div').removeClass('hidden');
            $('[name="price"]').val();
            $('[name="purchasePrice"]').val();
        }
    },
    'change .toggle-selling-unit'(event, instance){
        if ($(event.currentTarget).prop('checked')) {
            $('.selling-unit').removeClass('hidden')
        } else {
            $('.selling-unit').addClass('hidden');
        }
    }
});

// Edit
editTmpl.onCreated(function () {
    this.categoryList = new ReactiveVar();
    //let categoryId = Session.get('CategoryIdSession');
    Meteor.call('categoryList', 'Select One | No Parent', null, (err, result) => {
        this.categoryList.set(result);
    });
    if (this.data.scheme) {
        this.data.scheme.forEach((scheme) => {
            Meteor.call('getItem', scheme.itemId, function (err, result) {
                scheme.name = result.name;
                tmpCollection.insert(scheme);
            })
        })
    }
});
//on Destroyed
editTmpl.onDestroyed(function () {
    tmpCollection.remove({});
});

editTmpl.helpers({
    collection(){
        return Item;
    },
    toggleSellingUnit(){
        return this.sellingUnit ? '' : 'hidden';
    },
    checkSellingUnit(){
        return this.sellingUnit ? true : false;
    },
    toggleScheme(){
        return this.scheme ? '' : 'hidden';
    },
    checkScheme(){
        return this.scheme ? true : false;
    },
    categoryList(){
        //let categoryId = Session.get('CategoryIdSession');
        //return ReactiveMethod.call('categoryList', 'Select One | No Parent',categoryId);
        let list = [];
        let categories = Template.instance().categoryList.get();
        categories.forEach(function (category) {
            list.push({
                label: Spacebars.SafeString(category.label),
                value: category.value
            });
        });
        return list;
    }
});
editTmpl.events({
    'change .toggle-scheme'(event, instance){
        tmpCollection.remove({});
        if ($(event.currentTarget).prop('checked')) {
            $('.scheme').removeClass('hidden')
        } else {
            $('.scheme').addClass('hidden');
        }
    },
    'change .toggle-selling-unit'(event, instance){
        if ($(event.currentTarget).prop('checked')) {
            $('.selling-unit').removeClass('hidden')
        } else {
            $('.selling-unit').addClass('hidden');
        }
    }
});
// Show
showTmpl.onCreated(function () {
    this.dict = new ReactiveVar();
    let self = this.data;
    let tmpVar = this.dict;
    this.autorun(() => {
        this.subscribe('pos.item', {_id: self._id});
        getUnitName.callPromise({sellingUnit: self.sellingUnit})
            .then((result) => {
                this.dict.set(result);
            }).catch(function (err) {
                console.log(err.message);
            }
        );
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.item.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    data () {
        let data = Item.findOne(this._id);
        data.photoUrl = null;
        data.sellingUnit = Template.instance().dict.get();
        if (data.photo) {
            let img = Files.findOne(data.photo);
            if (img) {
                data.photoUrl = img.url();
            }
        }

        return data;
    }
});
//custom Object
Template.schemeItem.onCreated(function () {
    this.defaultPrice = new ReactiveVar(0);
    this.defaultItem = new ReactiveVar();
    this.autorun(() => {
        if (this.defaultItem.get()) {
            itemInfo.callPromise({
                _id: this.defaultItem.get()
            }).then((result) => {
                this.defaultPrice.set(result.price);
            }).catch((err) => {
                console.log(err.message);
            });
        }
    });
});
Template.schemeItem.helpers({
    defaultPrice(){
        let instance = Template.instance();
        return instance.defaultPrice.get() || 0;
    },
    schema() {
        return ItemsSchema;
    },
    tableSettings: function () {
        reactiveTableSettings.showFilter = false;
        reactiveTableSettings.showNavigation = 'never';
        reactiveTableSettings.showColumnToggles = false;
        reactiveTableSettings.collection = tmpCollection;
        reactiveTableSettings.fields = [
            {key: 'itemId', label: 'Item'},
            {key: 'name', label: 'Name'},
            {key: 'quantity', label: 'Quantity'},
            {
                key: 'price',
                label: 'Price',
                fn (value, object, key) {
                    return numeral(value).format('0,0.00');
                }
            },
            {
                key: '_id',
                label(){
                    return fa('bars', '', true);
                },
                headerClass: function () {
                    let css = 'text-center col-action-order-item';
                    return css;
                },
                tmpl: Template.Pos_schemeItemsAction, sortable: false
            }
        ];

        return reactiveTableSettings;
    }
});
Template.schemeItem.events({
    'change [name="itemId"]': function (event, instance) {
        instance.name = event.currentTarget.selectedOptions[0].text;
        instance.defaultItem.set(event.currentTarget.value);
        // instance.$('[name="qty"]').val('');
        // instance.$('[name="price"]').val('');
        // instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 0 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;
        instance.state('amount', amount);
    },
    'click .js-add-item': function (event, instance) {
        let itemId = instance.$('[name="itemId"]').val();
        let qty = parseInt(instance.$('[name="qty"]').val() == '' ? 1 : instance.$('[name="qty"]').val());
        let price = math.round(parseFloat(instance.$('[name="price"]').val()), 2);
        let amount = math.round(qty * price, 2);
        // Check exist
        // let exist = tmpCollection.findOne({itemId: itemId});
        // if (exist) {
        //     qty += parseInt(exist.quantity);
        //     amount = math.round(qty * price, 2);
        //     tmpCollection.update(
        //         {_id: exist._id},
        //         {$set: {quantity: qty, price: price, amount: amount}}
        //     );
        // } else {
        tmpCollection.insert({
            itemId: itemId,
            quantity: qty,
            price: price,
            name: instance.name
        });
        // }
    },
    // Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.tmpItem(fa('pencil', TAPi18n.__('pos.order.schema.itemId.label')), renderTemplate(Template.Pos_schemeItemsEdit, this));
    },
    'click .js-destroy-item': function (event, instance) {
        destroyAction(
            tmpCollection,
            {_id: this._id},
            {title: TAPi18n.__('pos.order.schema.itemId.label'), itemTitle: this.itemId}
        );
    }
});
//edit custom object
// Edit


// Hook
let hooksObject = {
    before: {
        insert(doc){
            let getScheme = tmpCollection.find({}, {fields: {itemId: 1, price: 1, quantity: 1}}).fetch();
            if (getScheme.length > 0) {
                doc.scheme = getScheme;
            }
            return doc;
        },
        update(doc){
            doc.$set.scheme = tmpCollection.find({}, {fields: {_id: 0, name: 0}}).fetch();
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.item().close();
        }
        tmpCollection.remove({});
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
Template.chartAccountDropDown.events({
    'click .add-new-chart-account'(event, instance){
        alertify.addNewChartAccount(fa('plus', 'Add New Chart Account'), renderTemplate(newChartAccount));
    }
});
AutoForm.addHooks([
    'Pos_itemNew',
    'Pos_itemEdit'
], hooksObject);
