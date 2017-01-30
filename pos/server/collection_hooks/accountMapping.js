import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting';

AccountMapping.before.insert(function (userId, doc) {
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        if (doc.isUsed && doc.account == null) {
            throw new Meteor.Error('Used chart account, you have to choice one chart account.');
        }
    }
    doc._id = idGenerator.gen(AccountMapping, 3);
});

AccountMapping.before.update(function (userId, doc, fieldNames, modifier, options) {
    let setting = AccountIntegrationSetting.findOne();
    if (setting && setting.integrate) {
        if (modifier.$set.isUsed && modifier.$set.account == null) {
            throw new Meteor.Error('Used chart account, you have to choice one chart account.');
        }
    }
});


