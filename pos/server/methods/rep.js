import {Meteor} from 'meteor/meteor';
import {Reps} from '../../imports/api/collections/rep';
import {Terms} from '../../imports/api/collections/terms';
Meteor.methods({
    getRepList(){
        this.unblock();
        let repList = [];
        let termList = []
        let reps = Reps.find();
        let terms = Terms.find();
        if (reps.count() > 0) {
            reps.forEach(function (rep) {
                repList.push({label: `${rep._id} | ${rep.name}`, value: rep._id});
            });
        }
        if(terms.count() > 0) {
            terms.forEach(function (term) {
                termList.push({label: `${term._id} | ${term.name}`, value: term._id});
            });
        }
        return {repList, termList};
    }
});

