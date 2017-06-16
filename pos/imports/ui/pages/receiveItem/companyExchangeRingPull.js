//Collections
import {CompanyExchangeRingPulls} from '../../../api/collections/companyExchangeRingPull';
import {Item} from '../../../api/collections/item';
import {itemsCollection} from '../../../api/collections/tmpCollection';
//pages
import './companyExchangeRingPull.html';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {vendorInfo} from '../../../../common/methods/vendor.js';
import {ReceiveDeletedItem} from './receiveItem-items.js'
var companyExchangeRingPullTmpl = Template.listCompanyExchangeRingPull;

companyExchangeRingPullTmpl.helpers({
    companyExchangeRingPulls(){
        let item = [];
        let companyExchangeRingPulls = CompanyExchangeRingPulls.find({
            status: 'active',
            vendorId: FlowRouter.query.get('vendorId')
        }).fetch();
        if (ReceiveDeletedItem.find().count() > 0) {
            ReceiveDeletedItem.find().forEach(function (item) {
                companyExchangeRingPulls.forEach(function (companyExchangeRingPull) {
                    companyExchangeRingPull.items.forEach(function (companyExchangeRingPullItem) {
                        if (companyExchangeRingPullItem.itemId == item.itemId) {
                            companyExchangeRingPullItem.remainQty += item.qty;
                            companyExchangeRingPull.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        companyExchangeRingPulls.forEach(function (companyExchangeRingPull) {
            companyExchangeRingPull.items.forEach(function (companyExchangeRingPullItem) {
                item.push(companyExchangeRingPullItem.itemId);
            });
        });
        Session.set('companyExchangeRingPullItems', item);
        return companyExchangeRingPulls;
    },
    hasCompanyExchangeRingPulls(){
        let count = CompanyExchangeRingPulls.find({
            status: 'active',
            vendorId: FlowRouter.query.get('vendorId')
        }).count();
        return count > 0;
    },
    getItemName(itemId){
        try {
            console.log(Item.find().fetch());
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});

companyExchangeRingPullTmpl.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.remain-qty').val();
        let companyExchangeRingPullId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.companyExchangeRingPullId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let companyExchangeRingPullIdExist = _.find(tmpCollection, function (o) {
                        return o.companyExchangeRingPullId == companyExchangeRingPullId;
                    });
                    if (companyExchangeRingPullIdExist) {
                        insertCompanyExchangeRingPullItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            companyExchangeRingPullItem: companyExchangeRingPullIdExist,
                            companyExchangeRingPullId: companyExchangeRingPullId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same companyExchangeRingPullId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result) => {
                        this.companyExchangeRingPullId = companyExchangeRingPullId;
                        this.qty = parseFloat(remainQty);
                        this.name = result.name;
                        this.lostQty = 0;
                        this.exactQty = parseFloat(remainQty);
                        this.amount = this.exactQty * this.price;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }
    },
    'change .remain-qty'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).val();
        let companyExchangeRingPullId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.companyExchangeRingPullId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let companyExchangeRingPullIdExist = _.find(tmpCollection, function (o) {
                        return o.companyExchangeRingPullId == companyExchangeRingPullId;
                    });
                    if (companyExchangeRingPullIdExist) {
                        insertCompanyExchangeRingPullItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            companyExchangeRingPullItem: companyExchangeRingPullIdExist,
                            companyExchangeRingPullId: companyExchangeRingPullId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same companyExchangeRingPullId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result) => {
                        this.companyExchangeRingPullId = companyExchangeRingPullId;
                        this.qty = parseFloat(remainQty);
                        this.exactQty = parseFloat(remainQty);
                        this.lostQty = 0;
                        this.name = result.name;
                        this.amount = this.exactQty * this.price;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }

    }
});
//insert companyExchagneRingPull order item to itemsCollection
let insertCompanyExchangeRingPullItem = ({self, remainQty, companyExchagneRingPullItem, companyExchagneRingPullId}) => {
    Meteor.call('getItem', self.itemId, (err, result) => {
        self.companyExchagneRingPullId = companyExchagneRingPullId;
        self.qty = remainQty;
        self.name = result.name;
        self.lostQty = 0;
        self.amount = self.qty * self.price;
        let getItem = itemsCollection.findOne({itemId: self.itemId});
        if (getItem) {
            if (getItem.qty + remainQty <= self.qty) {
                itemsCollection.update(getItem._id, {$inc: {qty: self.qty, amount: self.qty * getItem.price}});
                displaySuccess('Added!')
            } else {
                swal("Retry!", `ចំនួនបញ្ចូលចាស់(${getItem.qty}) នឹងបញ្ចូលថ្មី(${remainQty}) លើសពីចំនួនកម្ម៉ង់ទិញចំនួន ${(self.remainQty)}`, "error");
            }
        } else {
            itemsCollection.insert(self);
            displaySuccess('Added!')
        }
    });
};
function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting Invoices....", showConfirmButton: false
    });
    alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, doc)).maximize();
}