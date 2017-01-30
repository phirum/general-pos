import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Item} from '../../imports/api/collections/item.js';
import {Units} from '../../imports/api/collections/units.js'
import {ItemPriceForCustomers} from '../../imports/api/collections/itemPriceForCustomer.js'
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping.js'
// Check user password
export const itemInfo = new ValidatedMethod({
    name: 'pos.itemInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String},
        customerId: {type: String, optional: true},
        qty: {type: Number, optional: true},
        routeName: {type: String, optional: true}
    }).validator(),
    run({_id, customerId, qty, routeName}) {
        if (!this.isSimulation) {
            let arr = [];
            let data = Item.findOne(_id);
            if (customerId) {
                let itemPriceForCustomer = ItemPriceForCustomers.findOne({customerId: customerId});
                if (itemPriceForCustomer) {
                    let mapItemPrice = _.filter(itemPriceForCustomer.items, function (o) {
                        return o.itemId == _id;
                    });
                    if (!_.isEmpty(mapItemPrice)) {
                        data.price = mapItemPrice[0].price;
                    }
                }
            }
            if (qty && (routeName == 'pos.order' || routeName == 'pos.invoice')) {
                console.log(data._id, typeof(qty));
                let qtyRangePrice = QuantityRangeMapping.findOne({itemId: _id, startQty: {$lte: qty},endQty: {$gte: qty}});
                if (qtyRangePrice && data.mappingEnable) {
                    data.price = qtyRangePrice.price;
                }
            }
            if (data.sellingUnit) {
                let index = 1;
                data.sellingUnit.forEach(function (obj) {
                    let unit = Units.findOne(obj.unitId);
                    obj.unitName = unit ? unit.name : '';
                    arr.push({
                        convertAmount: obj.converter || 0,
                        label: `Convert Unit: ${obj.unitName} | Base Unit: ${data._unit.name} | converter: 1${obj.unitName} = ${obj.converter}${data._unit.name}`,
                        value: index
                    });
                    index++;
                });
                data.sellingUnit = arr;
            }
            return data;
        }
    }
});

export const getUnitName = new ValidatedMethod({
    name: 'pos.unitInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        sellingUnit: {type: [Object], blackbox: true}
    }).validator(),
    run(data){
        let listUnit = "";
        if (!this.isSimulation) {
            if (data.sellingUnit.length > 0) {
                data.sellingUnit.forEach((unit)=> {
                    listUnit += Units.findOne(unit.unitId).name + `, converter: ${unit.converter}`;
                })
            }
            return listUnit;
        }
    }
})
