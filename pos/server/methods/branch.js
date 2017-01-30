import {Meteor} from 'meteor/meteor';
import {Branch} from '../../../core/imports/api/collections/branch';

Meteor.methods({
    getBranch(id){
        return Branch.findOne(id);
    }
});