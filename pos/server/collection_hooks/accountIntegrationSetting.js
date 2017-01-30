import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

AccountIntegrationSetting.before.insert(function (userId, doc) {
    doc._id = idGenerator.gen(AccountIntegrationSetting, 3);
});

AccountIntegrationSetting.before.update(function (userId, doc, fieldNames, modifier, options) {
    if (modifier.$set.integrate) {
        let unMappingAccount = AccountMapping.findOne({isUsed: true, account: null});
        if (unMappingAccount) {
            throw new Meteor.Error('Please map all used chart accounts!');
        }
    }
});
