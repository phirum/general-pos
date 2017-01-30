import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Categories = new Mongo.Collection("pos_categories");
Categories.schema = new SimpleSchema({
    name: {
        type: String,
        //unique: true,
        max: 200
    },
    description: {
        type: String,
        optional: true
    },
    parentId: {
        type: String,
        optional: true,
      /*  autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One | No Parent',
                optionsMethod: 'getCategoryOptions',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let categoryId = Session.get('CategoryIdSession');
                        return {categoryId: categoryId};
                    }
                }
            }
        },*/
        autoform: {
            type: "select2"
        }
    },
    level: {
        type: Number,
        optional: true
    },
    _parent: {
        type: Object,
        blackbox: true,
        optional: true
    }
});

Meteor.startup(function () {
    Categories.schema.i18n("pos.category.schema");
    Categories.attachSchema(Categories.schema);
});