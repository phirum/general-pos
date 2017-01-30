import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {GroupInvoice} from '../../imports/api/collections/groupInvoice.js';
// Check user password
export const isGroupInvoiceClosed = new ValidatedMethod({
    name: 'pos.isGroupInvoiceClosed',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let groupInvoice = GroupInvoice.findOne(_id);
            return {paid: groupInvoice.status == 'closed' || groupInvoice.status == 'partial'};
        }
    }
});