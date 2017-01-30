import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {ReactiveMethod} from 'meteor/simple:reactive-method';

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

// Collection
import {Categories} from '../../api/collections/category.js';

// Tabular
import {CategoryTabular} from '../../../common/tabulars/category.js';

// Page
import './category.html';

// Declare template
let indexTmpl = Template.Pos_category,
    actionTmpl = Template.Pos_categoryAction,
    newTmpl = Template.Pos_categoryNew,
    editTmpl = Template.Pos_categoryEdit,
    showTmpl = Template.Pos_categoryShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('category', {size: 'lg'});
    createNewAlertify('categoryShow');

    // Reactive table filter

});

indexTmpl.helpers({
    tabularTable(){
        return CategoryTabular;
    },
    selector() {
        return {};
    }

});

indexTmpl.events({
    'click .js-create' (event, instance) {
        Session.set('CategoryIdSession', null);
        alertify.category(fa('plus', TAPi18n.__('pos.category.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        Session.set('CategoryIdSession', this._id);
        alertify.category(fa('pencil', TAPi18n.__('pos.category.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isCategoryHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        Categories,
                        {_id: id},
                        {title: TAPi18n.__('pos.category.title'), itemTitle: id}
                    );
                }
            }
        });


    },
    'click .js-display' (event, instance) {
        alertify.categoryShow(fa('eye', TAPi18n.__('pos.category.title')), renderTemplate(showTmpl, this));
    }
});

newTmpl.onCreated(function () {
    this.categoryList = new ReactiveVar();
    let categoryId = Session.get('CategoryIdSession');
    Meteor.call('categoryList', 'Select One | No Parent', categoryId, (err, result) => {
        this.categoryList.set(result);
    });
});
// New
newTmpl.helpers({

    collection(){
        return Categories;
    },
    categoryList(){
        //let categoryId = Session.get('CategoryIdSession');
        //return ReactiveMethod.call('categoryList', 'Select One | No Parent',categoryId);
        let list = [];
        let categories = Template.instance().categoryList.get();
        if(categories) {
            categories.forEach(function (category) {
                list.push({
                    label: Spacebars.SafeString(category.label),
                    value: category.value
                });
            });
        }
        return list;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.category', {_id: this.data._id});
    });
    this.categoryList = new ReactiveVar();
    let categoryId = Session.get('CategoryIdSession');
    Meteor.call('categoryList', 'Select One | No Parent', categoryId, (err, result) => {
        this.categoryList.set(result);
    });
});

editTmpl.helpers({

    collection(){
        return Categories;
    },
    data () {
        let data = Categories.findOne(this._id);
        return data;
    },
    categoryList(){
        let list = [];
        let categories = Template.instance().categoryList.get();
        if(categories) {
            categories.forEach(function (category) {
                list.push({
                    label: Spacebars.SafeString(category.label),
                    value: category.value
                });
            });
        }
        return list;
        // let categoryId = Session.get('CategoryIdSession');
        //  return ReactiveMethod.call('categoryList', 'Select One | No Parent', categoryId);
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.category', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.category.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = Categories.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.category().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_categoryNew',
    'Pos_categoryEdit'
], hooksObject);
