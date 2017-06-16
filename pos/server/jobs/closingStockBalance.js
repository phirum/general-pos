import ClosingStock from '../../imports/api/libs/closingStockBalance';
SyncedCron.add({
    name: 'Generate Closing Stock Balance',
    schedule: function (parser) {
        // parser is a later.parse object
        // return parser.text('every 2 hours');
        return parser.text('every 2 minutes');
    },
    job: function () {
            console.log(ClosingStock.generateClosingStockBalance());
    }
});