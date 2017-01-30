import {Meteor} from 'meteor/meteor';
import {Categories} from '../../../imports/api/collections/category.js';

let getCategoryIdsForExclusion = function (array, categories) {
    if (categories != null) {
        categories.forEach(function (c) {
            array.push(c._id);
            let cats = Categories.find({parentId: c._id});
            if (cats != null) {
                return getCategoryIdsForExclusion(array, cats);
            }
        });
    }
    return array;
};
let pushToList = function (array, obj) {
    let str = "";
    /*switch (obj.level) {
        case 0:
            str = "&#9829; ";
            break;
        case 1:
            str = "&nbsp;&nbsp;&nbsp;&#9830; ";
            break;
        case 2:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9827; ";
            break;
        case 3:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9824; ";
            break;
        case 4:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# ";
            break;
        case 5:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* ";
            break;
        case 6:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;$ ";
            break;
        case 7:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;& ";
            break;
        case 8:
            str = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;% ";
            break;
        default:
            str = "&#9829; ";

    }*/
    for (let i = 0; i < obj.level * 3; i++) str += "&nbsp;";
    array.push({
        // label: Spacebars.SafeString(str + obj.name),
        label: str + obj.name,
        value: obj._id
    });
    return array;
};

let getCategoryList = function (selector, array, categories, alreadyUse) {
    if (categories != null) {
        categories.forEach(function (c) {
            array = pushToList(array, c);
            alreadyUse.push(c._id);
            selector.parentId = c._id;
            let cats = Categories.find(selector);
            if (cats != null) {
                return getCategoryList(selector, array, cats, alreadyUse);
            }
        });
    }
    return array;
};

Meteor.methods({
    getCategoryOptions: function (options) {
        this.unblock();
        let list = [], selector = {};
        let searchText = options.searchText;
        let values = options.values;
        let params = options.params || {};

        /* if (searchText) {
         if (params.categoryId) {
         if (params.categoryId != null) {
         let arr = [params.categoryId];
         let categories = Categories.find({parentId: params.categoryId});
         arr = getCategoryIdsForExclusion(arr, categories);
         selector = {
         $or: [
         {_id: {$regex: searchText, $options: 'i'}},
         {name: {$regex: searchText, $options: 'i'}}
         ],
         _id: {$not: {$in: arr}}
         };
         }
         } else {
         selector = {
         $or: [
         {_id: {$regex: searchText, $options: 'i'}},
         {name: {$regex: searchText, $options: 'i'}}
         ]
         };
         }
         }
         else if (values.length) {
         if (params.categoryId) {
         let arr = [params.categoryId];
         let categories = Categories.find({parentId: params.categoryId});
         arr = getCategoryIdsForExclusion(arr, categories);
         selector = {
         _id: {$not: {$in: arr}, $in: values}
         }
         } else {
         selector = {_id: {$in: values}};
         }
         }
         */
        if (params.categoryId) {
            if (params.categoryId != null) {
                let arr = [params.categoryId];
                let categories = Categories.find({parentId: params.categoryId});
                arr = getCategoryIdsForExclusion(arr, categories);
                selector = {
                    _id: {$not: {$in: arr}}
                };
            }
        }
        let alreadyUse = [];
        Categories.find(selector, {sort: {level: 1}}).forEach(function (obj) {
            if (alreadyUse.indexOf(obj._id) == -1) {
                pushToList(list, obj);
                selector.parentId = obj._id;
                let categories = Categories.find(selector);
                list = getCategoryList(selector, list, categories, alreadyUse);
            }
        });
        return list;


        /* let data = Categories.find(selector, {limit: 10});
         data.forEach(function (value) {
         let label = value._id + ' : ' + value.name;
         list.push({label: label, value: value._id});
         });
         return list;*/
    },
    categoryList: function (param, categoryId) {
        var list = [];
        if (param != false) {
            var label = param != null ? param : "(Select One)";
            list.push({label: label, value: ""});
        }
        var selector = {};
        if (categoryId != null) {
            var arr = [categoryId];
            var categories = Categories.find({parentId: categoryId});
            arr = getCategoryIdsForExclusion(arr, categories);
            selector._id = {$not: {$in: arr}};
        }

        var alreadyUse = [];
        Categories.find(selector, {sort: {level: 1}}).forEach(function (obj) {
            if (alreadyUse.indexOf(obj._id) == -1) {
                debugger;
                pushToList(list, obj);
                selector.parentId = obj._id;
                var categories = Categories.find(selector);
                list = getCategoryList(selector, list, categories, alreadyUse);
            }
        });
        return list;
    }
    /*getCategoryList: function () {
     Pos.Collection.Categories.aggregate([
     {$match: {_id: "01010101"}},
     {
     $lookup: {
     from: "loan_location",
     localField: "parentId",
     foreignField: "_id",
     as: "level1"
     }
     },
     {$unwind: {path: "$level1", preserveNullAndEmptyArrays: true}},
     {
     $lookup: {
     from: "loan_location",
     localField: "level1.parentId",
     foreignField: "_id",
     as: "level2"
     }
     },
     {$unwind: {path: "$level2", preserveNullAndEmptyArrays: true}},
     {
     $lookup: {
     from: "loan_location",
     localField: "level2.parentId",
     foreignField: "_id",
     as: "level3"
     }
     },
     {$unwind: {path: "$level3", preserveNullAndEmptyArrays: true}}
     ])
     }*/
});




