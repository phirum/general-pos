export const ReceivePayment = new Mongo.Collection('pos_receivePayment');
ReceivePayment.schema = new SimpleSchema({
    invoiceId: {
        type: String
    },
    penalty: {
        type: Number,
        decimal: true,
    },
    discount: {
        type: Number,
        decimal: true,
        optional: true
    },
    paymentDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        decimal: true
    },
    dueAmount: {
        type: Number,
        decimal: true
    },
    balanceAmount: {
        type: Number,
        decimal: true
    },
    customerId: {
        type: String
    },
    status: {
        type: String
    },
    staffId: {
        type: String
    },
    paymentType: {
        type: String,
        optional: true
    },
    branchId: {
        type: String,
        optional: true
    },
    voucherId: {
        type: String,
        optional: true
    }
});
ReceivePayment.attachSchema(ReceivePayment.schema);
