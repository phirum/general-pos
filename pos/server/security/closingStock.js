import {ClosingStockBalance} from '../../imports/api/collections/closingStock.js';

// Lib
import './_init.js';

ClosingStockBalance.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
ClosingStockBalance.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
ClosingStockBalance.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
