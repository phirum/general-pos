import {PrivateMode} from '../../imports/api/collections/privateMode';

Meteor.startup(function () {
    if(PrivateMode.find().count() == 0) {
        PrivateMode.insert({
            enabled: true
        });
    }
});