import {Terms} from '../../imports/api/collections/terms';

Meteor.methods({
    getTerm(id){
        return Terms.findOne(id);
    }
});
