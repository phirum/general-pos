import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {AverageInventories} from '../../../imports/api/collections/inventory';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const stockBalanceReport = new ValidatedMethod({
    name: 'pos.stockBalanceReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            selector.branchId = {$in: []};
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                let asOfDate = moment(params.date).toDate();
                data.title.date = moment(asOfDate).format('YYYY-MMM-DD');
                selector.inventoryDate = {$lte: asOfDate};
            }
            if (params.branch) {
                selector.branchId = {$in: params.branch.split(',')};
            }
            if (params.items) {
                selector.itemId = {
                    $in: params.items.split(',')
                }
            }
            if (params.location) {
                selector.stockLocationId = {
                    $in: params.location.split(',')
                }
            }
            //check if user has right to view multi branches
            let user = Meteor.users.findOne({_id: Meteor.userId()});
            for (let i = 0; i < selector.branchId.$in.length; i++) {
                if (!_.includes(user.rolesBranch, selector.branchId.$in[i])) {
                    _.pull(selector.branchId.$in, selector.branchId.$in[i]);
                }
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctDotObject(filters[i], true)});
                    data.displayFields.push({field: correctDotObject(filters[i], false)});
                    project[correctDotObject(filters[i], false)] = `$${filters[i]}`;

                }
                data.fields.push({field: 'Remain QTY'}); //map total field for default
                data.displayFields.push({field: 'remainQty'});
                data.fields.push({field: 'Avg Price'}); //map total field for default
                data.displayFields.push({field: 'averagePrice'});
                data.fields.push({field: 'Last Amount'}); //map total field for default
                data.displayFields.push({field: 'lastAmount'});
                project['remainQty'] = '$lastDoc.remainQty'; //get total projection for default
                project['averagePrice'] = '$lastDoc.averagePrice'; //get total projection for default
                project['lastAmount'] = '$lastDoc.lastAmount'; //get total projection for default
            } else {
                project = {
                    'item': '$lastDoc.itemDoc.name',
                    'price': '$lastDoc.price',
                    'unit': '$lastDoc.itemDoc._unit.name',
                    'remainQty': '$lastDoc.remainQty',
                    'amount': '$lastDoc.amount',
                    'lastAmount': '$lastDoc.lastAmount',
                    'averagePrice': '$lastDoc.averagePrice'
                };
                data.fields = [{field: 'Item'}, {field: 'Unit'}, {field: 'Remain QTY'}, {field: 'Avg Price'}, {field: 'Last Amount'}];
                data.displayFields = [{field: 'item'}, {field: 'unit'}, {field: 'remainQty'}, {field: 'averagePrice'}, {field: 'lastAmount'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let inventories = AverageInventories.aggregate([
                {$match: selector},
                {$sort: {_id: 1, inventoryDate: 1}},
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: 'pos_categories',
                        localField: 'itemDoc.categoryId',
                        foreignField: '_id',
                        as: 'itemDoc.categoryDoc'
                    }
                },
                {$unwind: {path: '$itemDoc.categoryDoc', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "pos_stockLocations",
                        localField: "stockLocationId",
                        foreignField: "_id",
                        as: "locationDoc"
                    }
                },
                {$unwind: {path: '$locationDoc', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: "core_branch",
                        localField: "branchId",
                        foreignField: "_id",
                        as: "branchDoc"
                    }
                },
                {$unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        itemId: 1,
                        inventoryDate: 1,
                        itemDoc: 1,
                        branchDoc: 1,
                        locationDoc: 1,
                        stockLocationId: 1,
                        branchId: 1,
                        qty: 1,
                        price: 1,
                        remainQty: 1,
                        amount: 1,
                        lastAmount: 1,
                        averagePrice: 1
                    }
                },
                {
                    $group: {
                        _id: {branch: '$branchId', itemId: '$itemId', stockLocationId: '$stockLocationId'},
                        lastDoc: {$last: '$$ROOT'}
                    }
                },
                {
                    $group: {
                        _id: null,
                        data: {
                            $addToSet: project
                        },
                        total: {
                            $sum: '$lastDoc.lastAmount'
                        },
                        totalRemainQty: {
                            $sum: '$lastDoc.remainQty'
                        }
                    }
                }
            ]);

            if (inventories.length > 0) {
                let sortData = _.sortBy(inventories[0].data, 'item');
                inventories[0].data = sortData
                data.content = inventories;
            }
            return data
        }
    }
});


function correctDotObject(prop, forLabel) {
    let projectField = '';
    switch (prop) {
        case 'lastDoc.itemDoc.name':
            projectField = 'item';
            break;
        case 'lastDoc.price':
            projectField = 'price';
            break;
        case 'lastDoc.branchDoc.enShortName':
            projectField = 'branch';
            break;
        case 'lastDoc.locationDoc.name':
            projectField = 'location';
            break;
        case 'lastDoc.itemDoc._unit.name':
            projectField = 'unit';
            break;
    }

    return forLabel ? _.capitalize(projectField) : projectField;
}