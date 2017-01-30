import {LendingStocks} from '../../imports/api/collections/lendingStock.js';

// Lib
import './_init.js';

LendingStocks.permit(['insert'])
    .Pos_ifDataInsert()
    .allowInClientCode();
LendingStocks.permit(['update'])
    .Pos_ifDataUpdate()
    .allowInClientCode();
LendingStocks.permit(['remove'])
    .Pos_ifDataRemove()
    .allowInClientCode();
