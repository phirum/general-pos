import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {Item} from '../../imports/api/collections/item.js';
//
// Meteor.publish('pos.item', function posItem(selector = {}, options = {}) {
//     this.unblock();
//
//     new SimpleSchema({
//         selector: {type: Object, blackbox: true},
//         options: {type: Object, blackbox: true}
//     }).validate({selector, options});
//
//     if (this.userId) {
//         let data = Item.find(selector, options);
//
//         return data;
//     }
//
//     return this.ready();
// });

Meteor.publish('pos.item', function posItem(selector) {
    this.unblock();
    if (this.userId) {
        return Item.find(selector);
    }
    return this.ready();
});

Meteor.publish("api_getItems", function () {
    return Item.find();
}, {
    url: "api_getItems_url",
    httpMethod: "post"
});

Meteor.method("add-numbers", function (a, b) {
    return a + b;
}, {
    url: "add-numbers",
    getArgsFromRequest: function (request) {
        // Let's say we want this function to accept a form-encoded request with
        // fields named `a` and `b`.
        var content = request.body;

        // Since form enconding doesn't distinguish numbers and strings, we need
        // to parse it manually
        return [ parseInt(content.a, 10), parseInt(content.b, 10) ];
    }
})