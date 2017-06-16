export const GroupBill = new Mongo.Collection('pos_groupBill');
GroupBill_schema = new SimpleSchema({
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    dueDate: {
        type: Date,
    },
    invoices: {
        type: [Object],
        blackbox: true,
    },
    total: {
        type: Number,
        decimal: true
    },
    status: {
        type: String,
        autoValue(){
            if(this.isInsert) {
                return 'active';
            }
        }
    },
    vendorOrCustomerId: {
        type: String
    },
    branchId: {
        type: String,
        optional: true
    },
    closedAt: {
        type: Date,
        optional: true
    }
});
GroupBill.attachSchema(GroupBill_schema);