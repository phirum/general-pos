import {AccountMapping} from '../../imports/api/collections/accountMapping.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
Meteor.startup(function () {
    if (AccountIntegrationSetting.find().count() <= 0) {
        AccountIntegrationSetting.insert({integrate: false});
    }
    if (AccountMapping.find().count() <= 0) {
        let chartAccount = [
            {
                "_id": "001",
                "name": "Cash on Hand",
                isUsed: true,
                //"account": "111102 | Cash on Hand"
            },
            {
                "_id": "002",
                "name": "A/P",
                isUsed: true,
                //"account": "343434 | A/P"
            },
            {
                "_id": "003",
                "name": "A/R",
                isUsed: true,
                //"account": "121212 | A/R"
            },
            {
                "_id": "004",
                "name": "Purchase Discount",
                isUsed: true,
                //"account": "665566 | Purchase Discount"
            },
            {
                "_id": "005",
                "name": "Inventory Supplier Owing",
                isUsed: true,
                //"account": "120002 | Inventory Supplier Owing"
            },
            {
                "_id": "006",
                "name": "Inventory",
                isUsed: true,
                //"account": "120003 | Inventory"
            },
            {
                "_id": "007",
                "name": "Sale Discount",
                isUsed: true,
                //"account": "556655 | Sale Discount"
            },
            {
                "_id": "008",
                "name": "Owe Inventory Customer",
                isUsed: true,
                //"account": "320004 | Owe Inventory Customer"
            },
            {
                "_id": "009",
                "name": "Lending Stock",
                isUsed: true,
                //"account": "120005 | Lending Stock"
            },
            {
                "_id": "010",
                "name": "Ring Pull",
                isUsed: true,
                //"account": "120006 | Ring Pull"
            },
            {
                "_id": "011",
                "name": "Gratis",
                isUsed: true,
                //"account": "620009 | Gratis"
            },
            {
                "_id": "012",
                "name": "Inventory Ring Pull Owing",
                isUsed: true,
                //"account": "120008 | Inventory Ring Pull Owing"
            },
            {
                "_id": "013",
                "name": "Inventory Gratis Owing",
                isUsed: true,
                //"account": "120007 | Inventory Gratis Owing"
            },
            {
                "_id": "014",
                "name": "Lost Inventory",
                isUsed: true,
                //"account": "650009 | Lost Inventory"
            }, /* 15 */
            {
                "_id": "015",
                "name": "Sale Income",
                isUsed: true,
                //"account" : "565656 | Sale Income"
            },

            /* 16 */
            {
                "_id": "016",
                "name": "COGS",
                isUsed: true,
                //"account" : "666666 | COGS"
            }];
        chartAccount.forEach(function (obj) {
            AccountMapping.insert(obj);
        });
    }
});