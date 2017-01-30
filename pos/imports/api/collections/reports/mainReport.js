import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

export const selectReport = new SimpleSchema({
    goToReport: {
        type: String,
        autoform: {
            type: 'universe-select',
            label: false,
            placeholder: "Select a state"

        }
    }
});
