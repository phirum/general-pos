//for generate closing stock report
export const ClosingStockBalance = new Mongo.Collection('pos_closingStockBalance');

ClosingStockBalance.schema = new SimpleSchema({
    closingDateString: {
        type: String,
        index: true
    },
    closingDate: {
        type: Date,
        index: true,
    },
    items: {
        type: [Object],
    },
    'items.$': {
        type: Object,
        blackbox: true
    },
    branchId: {
        type: String
    }
});


ClosingStockBalance.attachSchema(ClosingStockBalance.schema);