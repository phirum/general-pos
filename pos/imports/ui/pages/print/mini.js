import './mini.html';

let indexTmpl = Template.pos_printMini;

indexTmpl.onCreated(function () {
    this.printData = new ReactiveVar({});
    this.userDoc = new ReactiveVar({});
    this.autorun(() => {
        let inv = FlowRouter.query.get('inv');
        if (inv) {
            Meteor.call('printMini', {invoiceId: inv}, (err, result) => {
                if (!err) {
                    this.printData.set(result.invoice);
                    this.userDoc.set(result.user)
                }
            });
        }
    });
});

indexTmpl.helpers({
    company(){
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc && doc.company;
    },
    invoiceTypeSaleOrder(invoiceType){
        return invoiceType == 'invoice';
    },
    data(){
        let instance = Template.instance();
        let data = instance.printData.get();
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        data.company = doc.company;
        return data;
    },
    currentStaff(){
        let instance = Template.instance();
        let user = instance.userDoc.get();
        return user && user.username;
    },
    hasPayment(paymentObj){
        return paymentObj && paymentObj.paidAmount > 0;
    },
    lookupRemainQty(sale, itemId){
        if (sale.invoiceType == 'invoice') {
            let invoiceObj = sale.invoiceDoc.items.find(x => x.itemId == itemId);
            return numeral(invoiceObj.remainQty).format('0,0.00');
        }
    },
    no(index){
        return index + 1;
    },
    existUnitConvert(unitConvertDoc){
        return !!unitConvertDoc;
    },
    renderBlankTd(sale){
        let concate = '';
        for (let i = sale && sale.saleDetails.length; i < 10; i++) {
            concate += `<tr style="height: 20px;">
                <td align="center">${i + 1}</td>
            <td align="left">
        </td>
            <td align="right"></td>
            <td align="right"></td>
            <td align="right"></td>
            <td align="right"></td>
            </tr>`
        }
        return concate;
    }
});
indexTmpl.events({
    'click .printInvoice'(event, instance){
        window.print();
    }
});