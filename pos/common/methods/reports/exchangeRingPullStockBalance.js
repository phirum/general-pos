import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {RingPullInventories} from '../../../imports/api/collections/ringPullInventory';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const exchangeRingPullStockBalanceReport = new ValidatedMethod({
    name: 'pos.exchangeRingPullStockBalanceStockBalance',
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

            // let date = _.trim(_.words(params.date, /[^To]+/g));
            if (params.date) {
                let asOfDate = moment(params.date).toDate();
                data.title.date = moment(asOfDate).format('YYYY-MM-DD');
                selector.createdAt = {$lte: asOfDate};
            }
            if (params.branch) {
                selector.branchId = {$in: params.branch.split(',')};
            }
            if (params.items) {
                selector.itemId = {
                    $in: params.items.split(',')
                }
            }

            //check if user has right to view multi branches
            let user = Meteor.users.findOne({_id: Meteor.userId()});
            for (let i = 0; i < selector.branchId.$in.length; i++) {
                if (!_.includes(user.rolesBranch, selector.branchId.$in[i])) {
                    _.pull(selector.branchId.$in, selector.branchId.$in[i]);
                }
            }


            /****** Title *****/

            /****** Content *****/
            let exchangeRingPullStockBalance = RingPullInventories.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {
                    $lookup: {
                        from: "core_branch",
                        localField: "branchId",
                        foreignField: "_id",
                        as: "branchDoc"
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $sort: {'itemDoc.name': -1}
                },
                {
                    $group: {
                        _id: {branchId: '$branchId', itemId: '$itemId'},
                        branchDoc: {$last: '$branchDoc'},
                        branchId: {$last: '$branchDoc._id'},
                        itemId: {$last: '$itemDoc._id'},
                        itemName: {$last: '$itemDoc.name'},
                        qty: {$last: '$qty'},
                        itemDoc: {
                            $last: '$itemDoc'
                        }
                    }
                },
                {
                    $group: {
                        _id: '$_id.branchId',
                        branchDoc: {$last: '$branchDoc'},
                        items: {
                            $push: {
                                itemId: '$itemId',
                                itemName: '$itemName',
                                qty: '$qty'
                            }
                        }
                    }
                },
                {
                    $match: {
                        _id: selector.branchId
                    }
                },
                {
                    $sort: {
                        'branchDoc.khName': 1
                    }
                }
            ]);
            if (exchangeRingPullStockBalance.length > 0) {
                data.content = exchangeRingPullStockBalance;
            }
            console.log(data.content);
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