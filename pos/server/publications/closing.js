import {Meteor} from 'meteor/meteor';
import {Closing} from '../../imports/api/collections/closing';

Meteor.publish('closingPub', function closingPub(){
    if(this.userId){
        let closing =  Closing.find({}, {sort: {closingDate: -1}, limit: 1});
        return closing;
    }
});