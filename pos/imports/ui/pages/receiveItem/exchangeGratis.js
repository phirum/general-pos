//Collections
import {ExchangeGratis} from '../../../api/collections/exchangeGratis';
import {Item} from '../../../api/collections/item';
import {itemsCollection} from '../../../api/collections/tmpCollection';
//pages
import './exchangeGratis.html';
import {destroyAction} from '../../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../../core/client/libs/display-alert.js';
import {vendorInfo} from '../../../../common/methods/vendor.js';
import {ReceiveDeletedItem} from './receiveItem-items.js'
var exchangeGratisTmpl = Template.listExchangeGratis;

exchangeGratisTmpl.helpers({
    exchangeGratises(){
        let item = [];
        let exchangeGratises = ExchangeGratis.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).fetch();
        if (ReceiveDeletedItem.find().count() > 0) {
            ReceiveDeletedItem.find().forEach(function (item) {
                console.log(item);
                exchangeGratises.forEach(function (exchangeGratis) {
                    exchangeGratis.items.forEach(function (exchangeGratisItem) {
                        if (exchangeGratisItem.itemId == item.itemId) {
                            exchangeGratisItem.remainQty += item.qty;
                            exchangeGratis.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        exchangeGratises.forEach(function (exchangeGratis) {
            exchangeGratis.items.forEach(function (exchangeGratisItem) {
                item.push(exchangeGratisItem.itemId);
            });
        });
        Session.set('exchangeGratisItems', item);
        return exchangeGratises;
    },
    hasExchangeGratises(){
        let count = ExchangeGratis.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).count();
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

exchangeGratisTmpl.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.remain-qty').val();
        let exchangeGratisId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.exchangeGratisId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let exchangeGratisIdExist = _.find(tmpCollection, function (o) {
                        return o.exchangeGratisId == exchangeGratisId;
                    });
                    if (exchangeGratisIdExist) {
                        insertExchangeGratisItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            exchangeGratisItem: exchangeGratisIdExist,
                            exchangeGratisId: exchangeGratisId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same exchangeGratisId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.exchangeGratisId = exchangeGratisId;
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
        let exchangeGratisId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.exchangeGratisId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let exchangeGratisIdExist = _.find(tmpCollection, function (o) {
                        return o.exchangeGratisId == exchangeGratisId;
                    });
                    if (exchangeGratisIdExist) {
                        insertExchangeGratisItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            exchangeGratisItem: exchangeGratisIdExist,
                            exchangeGratisId: exchangeGratisId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same exchangeGratisId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.exchangeGratisId = exchangeGratisId;
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
//insert exchangeGratis order item to itemsCollection
let insertExchangeGratisItem = ({self, remainQty, exchangeGratisItem, exchangeGratisId}) => {
    Meteor.call('getItem', self.itemId, (err, result)=> {
        self.exchangeGratisId = exchangeGratisId;
        self.qty = remainQty;
        self.name = result.name;
        self.lostQty=0;
        self.amount = self.qty * self.price;
        let getItem = itemsCollection.findOne({itemId: self.itemId});
        if (getItem) {
            if (getItem.qty + remainQty <= self.remainQty) {
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
