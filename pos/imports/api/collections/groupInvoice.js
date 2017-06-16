export const GroupInvoice = new Mongo.Collection('pos_groupInvoice');
GroupInvoice_schema = new SimpleSchema({
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

GroupInvoice.attachSchema(GroupInvoice_schema);