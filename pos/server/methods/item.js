import {Item} from '../../imports/api/collections/item';

Meteor.methods({
   findItemName(id){
       return Item.findOne(id);
   }
});