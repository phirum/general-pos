
export const AcceptTransfer_schema = new SimpleSchema({
    id:{
        type:String,
        label:'Transfer ID'
    },
    date: {
        type: Date,
        // defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',

                }
            }
        }
    },
});