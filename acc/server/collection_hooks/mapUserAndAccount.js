import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {MapUserAndAccount} from '../../imports/api/collections/mapUserAndAccount';
import {ChartAccount} from '../../imports/api/collections/chartAccount';
import {ChartAccountNBC} from '../../imports/api/collections/chartAccountNBC';

// Customer
var module = 'Acc';

MapUserAndAccount.before.insert(function (userId, doc) {
    
    var prefix = doc.branchId + "-";
    doc._id = idGenerator.genWithPrefix(MapUserAndAccount, prefix, 6);
    let transaction=[];

    _.each(doc.transaction, function (obj) {
        if (!_.isNull(obj)) {
            var accountId = obj.chartAccount.split('|');
            var account = ChartAccount.findOne({code: accountId[0].replace(/\s+/g, '')}, {
                fields: {
                    name: 1,
                    accountTypeId: 1,
                    code: 1,
                    level: 1,
                    parentId: 1
                }
            });
            obj.accountDoc = account;
            transaction.push(obj);
        }
    });

    doc.transaction = transaction;
    var userName= Meteor.users.findOne({_id: doc.userId}).username;
    doc.userName = userName;


});
MapUserAndAccount.before.update(function (userId, doc, fieldNames, modifier, options) {
    
    var userName = Meteor.users.findOne({_id: modifier.$set.userId}).username;
    modifier.$set.userName = userName;
    let transaction=[];

    _.each(modifier.$set.transaction, function (obj) {
        if (!_.isNull(obj)) {
            var accountId = obj.chartAccount.split('|');
            var account = ChartAccount.findOne({code: accountId[0].replace(/\s+/g, '')}, {
                fields: {
                    name: 1,
                    accountTypeId: 1,
                    code: 1,
                    level: 1,
                    parentId: 1
                }
            });
            obj.accountDoc = account;
            transaction.push(obj);
        }
    });

    modifier.$set.transaction = transaction;

});
